export class AppError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly recoveryHint: string;

  constructor(code: string, message: string, retryable = true, recoveryHint = "Please try again.") {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.retryable = retryable;
    this.recoveryHint = recoveryHint;
  }
}

export const ERROR_MESSAGES: Record<string, { title: string; hint: string }> = {
  EMPTY_DOCUMENT: {
    title: "No Text Detected",
    hint: "Make sure the document is well-lit, laid flat, and the camera is in focus.",
  },
  OCR_FAILED: {
    title: "OCR Scan Interrupted",
    hint: "The recognition engine encountered an error. Try uploading a clearer image or cropped section.",
  },
  BFF_TIMEOUT: {
    title: "Simplification Took Too Long",
    hint: "The AI service is taking longer than expected. You can retry with a shorter document section.",
  },
  NETWORK_UNAVAILABLE: {
    title: "Service Temporarily Unreachable",
    hint: "Check your internet connection or verify the backend service is running.",
  },
  INVALID_FILE_TYPE: {
    title: "Unsupported File Format",
    hint: "Please select an image file (JPEG, PNG, or WebP).",
  },
};
