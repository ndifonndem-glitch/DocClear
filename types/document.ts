export interface DocumentSession {
  id: string;
  fileName: string;
  fileDataUrl: string;
  extractedText: string;
  ocrConfidence: number;
  status: "idle" | "scanning" | "reviewed" | "simplified" | "error";
  createdAt: number;
}

export interface OCRProgress {
  status: "idle" | "loading-core" | "initializing" | "recognizing" | "completed" | "error";
  progress: number; // 0 to 1
  message: string;
}

export type ReadingLevel = "simplified" | "standard" | "detailed";
