import { createWorker, Worker } from "tesseract.js";
import { OCRProgress, ScannedPage } from "@/types/document";

/**
 * Rotates an image dataUrl by the specified degrees (0, 90, 180, 270)
 * using an off-screen HTML5 Canvas.
 */
export function rotateImage(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    if (normalizedDegrees === 0) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const rads = (normalizedDegrees * Math.PI) / 180;
      if (normalizedDegrees === 90 || normalizedDegrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

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

/**
 * Extracts text sequentially across multiple scanned pages (1 to 5 pages),
 * reusing a single Tesseract worker instance for high performance and low memory.
 */
export async function extractTextFromMultipleImages(
  pages: ScannedPage[],
  onProgress?: (progress: OCRProgress, pageIndex: number, totalPages: number) => void
): Promise<{ text: string; confidence: number }> {
  if (!pages || pages.length === 0) {
    throw new Error("No pages provided for text extraction.");
  }

  // If only 1 page, use single extractor
  if (pages.length === 1) {
    const rotated = await rotateImage(pages[0].dataUrl, pages[0].rotation);
    return extractTextFromImage(rotated, (p) => onProgress?.(p, 0, 1));
  }

  let worker: Worker | null = null;
  const totalPages = pages.length;

  try {
    onProgress?.(
      {
        status: "loading-core",
        progress: 0.05,
        message: "Initializing OCR engine for multi-page scan...",
      },
      0,
      totalPages
    );

    let activePageIndex = 0;

    worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pageBase = activePageIndex / totalPages;
          const pagePortion = (1 / totalPages) * m.progress;
          const totalPct = Math.min(0.99, pageBase + pagePortion);
          onProgress?.(
            {
              status: "recognizing",
              progress: totalPct,
              message: `Scanning Page ${activePageIndex + 1} of ${totalPages} (${Math.round(m.progress * 100)}%)...`,
            },
            activePageIndex,
            totalPages
          );
        }
      },
    });

    const pageResults: Array<{ text: string; confidence: number }> = [];

    for (let i = 0; i < totalPages; i++) {
      activePageIndex = i;
      const page = pages[i];

      onProgress?.(
        {
          status: "recognizing",
          progress: i / totalPages,
          message: `Preparing Page ${i + 1} of ${totalPages}...`,
        },
        i,
        totalPages
      );

      // Pre-apply canvas rotation if user rotated the page
      const rotatedDataUrl = await rotateImage(page.dataUrl, page.rotation);
      const ret = await worker.recognize(rotatedDataUrl);

      pageResults.push({
        text: ret.data.text.trim(),
        confidence: Math.round(ret.data.confidence) / 100,
      });
    }

    // Check if any meaningful text was extracted across any of the pages
    const combinedActualText = pageResults.map((r) => r.text.trim()).join(" ");
    const lettersCount = combinedActualText.replace(/[^a-zA-Z0-9]/g, "").length;

    // If images contain no readable document text (e.g. photos of people, scenery, objects)
    if (lettersCount < 5) {
      onProgress?.(
        {
          status: "completed",
          progress: 1.0,
          message: "Scan complete. No readable document text detected.",
        },
        totalPages - 1,
        totalPages
      );
      return {
        text: "",
        confidence: 0,
      };
    }

    // Merge multi-page text with clear page breaks
    const mergedSections = pageResults.map((res, idx) => {
      return `--- [PAGE ${idx + 1}] ---\n${res.text}`;
    });

    const mergedText = mergedSections.join("\n\n");
    const avgConfidence =
      pageResults.reduce((acc, r) => acc + r.confidence, 0) / (pageResults.length || 1);

    onProgress?.(
      {
        status: "completed",
        progress: 1.0,
        message: `Extracted all ${totalPages} pages successfully.`,
      },
      totalPages - 1,
      totalPages
    );

    return {
      text: mergedText,
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } catch (err) {
    onProgress?.(
      {
        status: "error",
        progress: 0,
        message: "Failed during multi-page text extraction.",
      },
      0,
      totalPages
    );
    throw err;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
