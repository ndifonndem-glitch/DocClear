/**
 * Input Sanitation and Validation Utilities
 */

export function sanitizeText(input: string): string {
  if (!input) return "";
  // Strip null bytes and control characters while preserving newlines and punctuation
  return input
    .replace(/\0/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

export function validateDocumentText(text: string): { valid: boolean; error?: string } {
  const cleaned = sanitizeText(text);

  if (cleaned.length === 0) {
    return { valid: false, error: "Document text is empty. Please check the scan." };
  }

  // Strip multi-page demarcation headers to verify actual content
  const contentWithoutHeaders = cleaned.replace(/---\s*\[PAGE\s*\d+\]\s*---/gi, "").trim();
  const alphanumericCount = contentWithoutHeaders.replace(/[^a-zA-Z0-9]/g, "").length;

  if (contentWithoutHeaders.length < 10 || alphanumericCount < 5) {
    return { valid: false, error: "Extracted text does not contain readable document content. Minimum 10 characters required." };
  }

  if (cleaned.length > 50000) {
    return { valid: false, error: "Text exceeds maximum limit of 50,000 characters. Please review a shorter section." };
  }

  return { valid: true };
}
