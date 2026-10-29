import { SimplificationRequest, SimplificationResponse, APIErrorResponse } from "@/types/api";
import { AppError } from "@/lib/errors";

export async function requestSimplification(
  payload: SimplificationRequest
): Promise<SimplificationResponse> {
  try {
    const query = typeof window !== "undefined" ? window.location.search : "";
    const res = await fetch(`/api/analyse${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const htmlText = await res.text();
      throw new AppError(
        "MALFORMED_JSON_ERROR",
        `Malformed Response (HTTP ${res.status}): Server returned non-JSON HTML data (${htmlText.replace(/<[^>]*>?/gm, "").trim().slice(0, 80)}).`,
        true
      );
    }

    const data = await res.json().catch(() => {
      throw new AppError(
        "JSON_PARSE_ERROR",
        `Failed to parse server response as JSON (HTTP ${res.status}).`,
        true
      );
    });

    if (!res.ok) {
      const errData = data as APIErrorResponse;
      throw new AppError(
        errData.code || "UPSTREAM_ERROR",
        errData.message || `Server returned error status HTTP ${res.status}.`,
        errData.retryable ?? true
      );
    }

    return data as SimplificationResponse;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Unable to communicate with the simplification service. Please check your connection.",
      true
    );
  }
}
