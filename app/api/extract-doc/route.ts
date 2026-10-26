import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
const { PDFParse } = require("pdf-parse");
import mammoth from "mammoth";

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
      try {
        parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        const extracted = (
          data.pages && data.pages.length > 0
            ? data.pages.map((p: any) => p.text).join("\n")
            : data.text || ""
        ).trim();

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
          numPages: data.total || data.pages?.length || 1,
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
