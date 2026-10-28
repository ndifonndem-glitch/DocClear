/**
 * EduStack Lite Connector
 * Interoperates with services/bff.py (Port 8080) and inference_shim.py (Port 8000).
 * Provides health probing, request forwarding, and automatic local failover.
 */

export interface EduStackStatus {
  isAvailable: boolean;
  mode?: "mock" | "classifier" | "agent";
  url: string;
  latencyMs?: number;
}

export const EDUSTACK_DEFAULT_URL = process.env.EDUSTACK_BFF_URL || "http://127.0.0.1:8080";

/**
 * Checks if EduStack Lite BFF is currently running on port 8080
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
    // Offline or unreachable
  }

  return {
    isAvailable: false,
    url: EDUSTACK_DEFAULT_URL,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Forwards an image or task to the EduStack BFF
 */
export async function forwardToEduStackBFF(
  imageBlob: Blob,
  taskNote?: string
): Promise<{ status: string; label: string; confidence: number; summary: string }> {
  const formData = new FormData();
  formData.append("image", imageBlob, "document_capture.jpg");
  if (taskNote) {
    formData.append("task", taskNote);
  }

  const res = await fetch(`${EDUSTACK_DEFAULT_URL}/api/analyse`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || "EduStack BFF request failed");
  }

  return await res.json();
}
