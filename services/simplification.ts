import { SimplificationRequest, SimplificationResponse, APIErrorResponse } from "@/types/api";
import { AppError } from "@/lib/errors";

/** Client wait window exceeds the 45s EduStack BFF agent timeout. */
export const SIMPLIFICATION_CLIENT_TIMEOUT_MS = 60000;

export async function requestSimplification(
  payload: SimplificationRequest,
  options?: { signal?: AbortSignal }
): Promise<SimplificationResponse> {
  const controller = new AbortController();
  let timedOut = false;

  const onCallerAbort = () => {
    timedOut = false;
    controller.abort();
  };

  if (options?.signal) {
    if (options.signal.aborted) {
      throw new AppError(
        "REQUEST_ABORTED",
        "Simplification cancelled by user. You can modify the text and try again.",
        true
      );
    }
    options.signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, SIMPLIFICATION_CLIENT_TIMEOUT_MS);

  try {
    const query = typeof window !== "undefined" ? window.location.search : "";
    const res = await fetch(`/api/analyse${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await res.text();
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html") || /^\s*</.test(rawBody)) {
      throw new AppError(
        "MALFORMED_JSON_ERROR",
        `Malformed Response (HTTP ${res.status}): Server returned a non-JSON HTML error page.`,
        true
      );
    }

    let data: unknown;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      throw new AppError(
        "JSON_PARSE_ERROR",
        `Failed to parse server response as JSON (HTTP ${res.status}).`,
        true
      );
    }

    if (!res.ok) {
      const errData = (data ?? {}) as Partial<APIErrorResponse>;
      const nonRetryableStatus = res.status === 413 || res.status === 415 || res.status === 400;
      const fallbackCode =
        res.status === 415
          ? "UNSUPPORTED_MEDIA_TYPE"
          : res.status === 413
          ? "PAYLOAD_TOO_LARGE"
          : res.status === 429
          ? "RATE_LIMITED"
          : "UPSTREAM_ERROR";

      throw new AppError(
        errData.code || fallbackCode,
        errData.message || `Server returned error status HTTP ${res.status}.`,
        errData.retryable ?? !nonRetryableStatus
      );
    }

    if (!data || typeof data !== "object") {
      throw new AppError(
        "MALFORMED_JSON_ERROR",
        "Unexpected empty response from simplification server.",
        true
      );
    }

    return data as SimplificationResponse;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError") ||
      controller.signal.aborted
    ) {
      if (timedOut) {
        throw new AppError(
          "BFF_TIMEOUT",
          "Simplification timed out after 60 seconds waiting for the agent backend. Please try again.",
          true
        );
      }
      throw new AppError(
        "REQUEST_ABORTED",
        "Simplification cancelled by user. You can modify the text and try again.",
        true
      );
    }
    throw new AppError(
      "NETWORK_ERROR",
      error instanceof Error
        ? error.message
        : "Unable to communicate with the simplification service. Please check your connection.",
      true
    );
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener("abort", onCallerAbort);
  }
}
