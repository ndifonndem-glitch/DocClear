import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

// Polyfill browser globals missing in Node.js serverless environments (Vercel / AWS Lambda / Linux containers)
// pdf-parse v2 requires these when @napi-rs/canvas cannot be loaded in serverless runtimes.
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    constructor(_init?: any) {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    transformPoint(point: any) { return point; }
    inverse() { return this; }
  };
}

if (typeof (globalThis as any).ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width || 0;
      this.height = height || 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    }
  };
}

if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {
    constructor(_d?: any) {}
    addPath() {}
  };
}

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", code: "NO_FILE", message: "No document file was provided." },
        { status: 400 }
      );
    }

    // Strict File Size Validation
    if (file.size === 0) {
      return NextResponse.json(
        {
          status: "error",
          code: "EMPTY_FILE",
          message: "The selected file is empty (0 bytes). Please upload a valid document.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          status: "error",
          code: "FILE_TOO_LARGE",
          message: `File size limit exceeded: ${sizeMB} MB. The maximum allowed size is 15 MB. Please choose a smaller or compressed document.`,
        },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. PDF Extraction
    if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
      let parser: any = null;
      let extracted = "";
      let numPages = 1;

      try {
        let PDFParseClass: any = null;
        try {
          // Dynamic require after DOM polyfills are active
          // @ts-ignore
          const pdfParseModule = require("pdf-parse");
          PDFParseClass = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
        } catch (modErr) {
          console.warn("Could not load pdf-parse module in serverless:", modErr);
        }

        if (PDFParseClass && typeof PDFParseClass === "function") {
          try {
            parser = new PDFParseClass({ data: buffer });
            if (typeof parser.getText === "function") {
              const data = await parser.getText();
              extracted = (
                data.pages && data.pages.length > 0
                  ? data.pages.map((p: any) => p.text).join("\n")
                  : data.text || ""
              ).trim();
              numPages = data.total || data.pages?.length || 1;
            }
          } catch (pErr) {
            console.warn("PDFParse execution error, falling back to stream extraction:", pErr);
          }
        }

        // Resilient Stream Fallback for serverless environments
        if (!extracted || extracted.length === 0) {
          const rawPdfString = buffer.toString("latin1");
          const textChunks: string[] = [];
          
          // Match text blocks between BT (Begin Text) and ET (End Text)
          const btEtRegex = /BT[\s\S]*?ET/g;
          let match: RegExpExecArray | null;
          while ((match = btEtRegex.exec(rawPdfString)) !== null) {
            const block = match[0];
            // Extract literal strings: (Text) Tj
            const tjRegex = /\(([^)]+)\)\s*Tj/g;
            let tjMatch: RegExpExecArray | null;
            while ((tjMatch = tjRegex.exec(block)) !== null) {
              textChunks.push(tjMatch[1]);
            }
            // Extract kerning array strings: [(T) 10 (ext)] TJ
            const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
            let arrMatch: RegExpExecArray | null;
            while ((arrMatch = arrayTjRegex.exec(block)) !== null) {
              const inner = arrMatch[1];
              const parts = inner.match(/\(([^)]+)\)/g);
              if (parts) {
                textChunks.push(parts.map((p) => p.slice(1, -1)).join(""));
              }
            }
          }

          if (textChunks.length > 0) {
            extracted = textChunks.join(" ").replace(/\s+/g, " ").trim();
          }
        }

        if (extracted.length === 0) {
          return NextResponse.json(
            {
              status: "warning",
              code: "PDF_SCANNED_IMAGE",
              message:
                "This PDF appears to be a scanned image without selectable text. Please upload it as an image (JPEG/PNG) to use our OCR engine.",
            },
            { status: 422 }
          );
        }

        return NextResponse.json({
          status: "ok",
          text: extracted,
          numPages: numPages || 1,
          fileName: file.name,
          fileType: "pdf",
        });
      } catch (pdfErr) {
        console.error("PDF ERROR:", pdfErr);
        return NextResponse.json(
          {
            status: "error",
            code: "PDF_PARSE_FAILED",
            message: "Unable to read this PDF file. It may be password-protected or corrupted.",
          },
          { status: 422 }
        );
      } finally {
        if (parser && typeof parser.destroy === "function") {
          try {
            await parser.destroy();
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }

    // 2. Word (.docx) Extraction
    if (
      fileName.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value.trim();

        if (text.length === 0) {
          return NextResponse.json(
            {
              status: "warning",
              code: "EMPTY_DOCX",
              message: "The Word document did not contain any readable text.",
            },
            { status: 422 }
          );
        }

        return NextResponse.json({
          status: "ok",
          text: text,
          fileName: file.name,
          fileType: "docx",
        });
      } catch (docxErr) {
        return NextResponse.json(
          {
            status: "error",
            code: "DOCX_PARSE_FAILED",
            message: "Unable to extract text from this Word document. It may be corrupted.",
          },
          { status: 422 }
        );
      }
    }

    // Unsupported format
    return NextResponse.json(
      {
        status: "error",
        code: "UNSUPPORTED_TYPE",
        message: "Unsupported file format. Please upload a PDF, Word document (.docx), plain text (.txt), or image.",
      },
      { status: 415 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        code: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "Failed to process document file.",
      },
      { status: 500 }
    );
  }
}
