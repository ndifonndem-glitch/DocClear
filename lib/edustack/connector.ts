/**
 * EduStack Lite Connector (server-side only).
 * Interoperates with services/bff.py (Port 8080) and OpenClaw Gateway (Port 18789).
 * Keeps optional bearer tokens on the server and never exposes credentials to client code.
 */

export interface EduStackStatus {
  isAvailable: boolean;
  mode?: "mock" | "classifier" | "agent";
  url: string;
  latencyMs?: number;
}

export interface EduStackBFFResult {
  status: "done" | "needs_review";
  label: string;
  confidence: number;
  alternatives?: Array<{ label: string; confidence: number }>;
  summary: string;
  runId: string;
}

export class EduStackBFFHttpError extends Error {
  status: number;
  code: string;
  retryable: boolean;

  constructor(status: number, code: string, message: string, retryable: boolean) {
    super(message);
    this.name = "EduStackBFFHttpError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export const EDUSTACK_DEFAULT_URL =
  process.env.EDUSTACK_BFF_URL || "http://127.0.0.1:8080";

/** Server timeout exceeds the 45s EduStack BFF agent timeout. */
const BFF_FORWARD_TIMEOUT_MS = 55000;

/**
 * Decodes an image base64 data URL (JPEG, PNG, WebP) into a Blob for BFF multipart upload.
 */
export function dataUrlToImageBlob(dataUrl: string): Blob | null {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim()
  );
  if (!match) return null;
  const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0) return null;
  return new Blob([buffer], { type: mime });
}

/**
 * Checks whether the EduStack Lite BFF is reachable and returns its active mode.
 */
export async function probeEduStackHealth(): Promise<EduStackStatus> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${EDUSTACK_DEFAULT_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        isAvailable: true,
        mode: data.mode || "mock",
        url: EDUSTACK_DEFAULT_URL,
        latencyMs: Date.now() - startTime,
      };
    }
  } catch {
    // Offline or unreachable — caller will fall back to Gemini or local engine.
  }

  return {
    isAvailable: false,
    url: EDUSTACK_DEFAULT_URL,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Forwards an image upload and optional short task note to the EduStack BFF.
 * Propagates HTTP contract errors (429/503 retryable, 415/413 non-retryable, malformed non-JSON)
 * via EduStackBFFHttpError while throwing generic network errors when the BFF is offline.
 */
export async function forwardToEduStackBFF(
  imageBlob: Blob,
  taskNote?: string,
  failParam?: string | null
): Promise<EduStackBFFResult> {
  const formData = new FormData();
  const ext =
    imageBlob.type === "image/png"
      ? "png"
      : imageBlob.type === "image/webp"
      ? "webp"
      : "jpg";
  formData.append("image", imageBlob, `document_capture.${ext}`);
  if (taskNote) {
    formData.append("task", taskNote.slice(0, 200));
  }

  const targetUrl = new URL(`${EDUSTACK_DEFAULT_URL}/api/analyse`);
  if (failParam) {
    targetUrl.searchParams.set("fail", failParam);
  }

  const headers: Record<string, string> = {};
  const bffToken = process.env.EDUSTACK_BFF_TOKEN?.trim();
  if (bffToken) {
    headers.Authorization = `Bearer ${bffToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BFF_FORWARD_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(targetUrl.toString(), {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const rawBody = await res.text();
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html") || /^\s*</.test(rawBody)) {
    throw new EduStackBFFHttpError(
      502,
      "MALFORMED_UPSTREAM_RESPONSE",
      `EduStack BFF returned non-JSON HTML data (HTTP ${res.status}).`,
      true
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    throw new EduStackBFFHttpError(
      502,
      "MALFORMED_UPSTREAM_RESPONSE",
      `EduStack BFF returned unreadable JSON (HTTP ${res.status}).`,
      true
    );
  }

  if (!res.ok) {
    const nonRetryable = res.status === 413 || res.status === 415 || res.status === 400;
    const retryable =
      typeof parsed.retryable === "boolean" ? parsed.retryable : !nonRetryable;
    const code =
      typeof parsed.code === "string"
        ? parsed.code
        : res.status === 429
        ? "rate_limited"
        : res.status === 415
        ? "bad_image"
        : res.status === 413
        ? "too_large"
        : "upstream_error";
    const message =
      typeof parsed.message === "string"
        ? parsed.message
        : `EduStack BFF returned HTTP ${res.status}.`;
    throw new EduStackBFFHttpError(res.status, code, message, retryable);
  }

  const confidenceNum = Number(parsed.confidence);
  const validConfidence = Number.isFinite(confidenceNum)
    ? Math.min(1, Math.max(0, confidenceNum))
    : 0;
  const status: "done" | "needs_review" =
    parsed.status === "needs_review" || validConfidence < 0.7 ? "needs_review" : "done";

  return {
    status,
    label: typeof parsed.label === "string" ? parsed.label : "unknown",
    confidence: validConfidence,
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    runId: typeof parsed.runId === "string" ? parsed.runId : "",
  };
}
