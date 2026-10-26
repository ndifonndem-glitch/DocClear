import { SimplificationRequest, SimplificationResponse, APIErrorResponse } from "@/types/api";
import { AppError } from "@/lib/errors";

export async function requestSimplification(
  payload: SimplificationRequest
): Promise<SimplificationResponse> {
  try {
    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errData = data as APIErrorResponse;
      throw new AppError(
        errData.code || "UPSTREAM_ERROR",
        errData.message || "Failed to simplify document.",
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
      "Unable to communicate with the simplification service. Please check your connection.",
      true
    );
  }
}
