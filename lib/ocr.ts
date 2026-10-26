import { createWorker, Worker } from "tesseract.js";
import { OCRProgress } from "@/types/document";

export async function extractTextFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: OCRProgress) => void
): Promise<{ text: string; confidence: number }> {
  let worker: Worker | null = null;

  try {
    onProgress?.({
      status: "loading-core",
      progress: 0.1,
      message: "Loading client-side OCR core...",
    });

    worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({
            status: "recognizing",
            progress: 0.2 + m.progress * 0.75,
            message: `Extracting text: ${Math.round(m.progress * 100)}%`,
          });
        }
      },
    });

    onProgress?.({
      status: "recognizing",
      progress: 0.2,
      message: "Analyzing document lines and letters...",
    });

    const ret = await worker.recognize(imageSource);

    onProgress?.({
      status: "completed",
      progress: 1.0,
      message: "Text extraction complete.",
    });

    return {
      text: ret.data.text.trim(),
      confidence: Math.round(ret.data.confidence) / 100,
    };
  } catch (err) {
    onProgress?.({
      status: "error",
      progress: 0,
      message: "Failed to extract text from document image.",
    });
    throw err;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
