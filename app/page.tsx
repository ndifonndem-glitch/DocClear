"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Shield } from "lucide-react";
import { CameraCapture, SupportedFileType } from "@/components/capture/CameraCapture";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { extractTextFromImage, extractTextFromMultipleImages } from "@/lib/ocr";
import { OCRProgress, ScannedPage } from "@/types/document";

const SAMPLE_DOCUMENTS = [
  {
    title: "Employment",
    tag: "Job Offer",
    subtitle: "Job offer & salary terms",
    theme: "text-blue-700",
    text: "Employment Agreement between Northstar Technologies Ltd. and Jordan Smith. Position: Junior Software Developer. Start date: 2 November 2026. Working hours: 40 hours per week, Monday to Friday, 9:00 AM to 5:00 PM, with 1 hour lunch break. Monthly salary: ₹35,000 (before tax and deductions), payable on the last working day of each calendar month. Annual paid leave: 18 days. Probationary period: 3 months. Notice period required after probation: 30 calendar days.",
  },
  {
    title: "Tenancy",
    tag: "Rent & Bond",
    subtitle: "Rent and bond clause",
    theme: "text-blue-700",
    text: "The Tenant shall remit payment to the Landlord on the first day of each calendar month the sum of $1,850.00 as rent. In the event of default exceeding seven (7) days, an administrative penalty of 5% of arrears shall apply. The bond sum of $3,700.00 shall be held pursuant to statutory requirements and shall not be released prior to formal inspection and indemnification against damage.",
  },
  {
    title: "Medical bill",
    tag: "Healthcare",
    subtitle: "Billing and insurance notice",
    theme: "text-teal-700",
    text: "Notice of patient liability: Outstanding co-payment balance of $240.00 is due within fourteen (14) calendar days of notice. Failure to remit payment or provide proof of third-party indemnity may result in referral to statutory recovery agents and forfeiture of future elective appointments.",
  },
  {
    title: "Council notice",
    tag: "Bylaw",
    subtitle: "Official bylaw notice",
    theme: "text-amber-800",
    text: "Pursuant to Bylaw 14(B), the registered owner must remediate overgrown vegetation adjacent to public footpaths within twenty-one (21) days. Failure to comply shall empower the municipal authority to execute works at the owner's sole expense with added administrative penalties.",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<SupportedFileType | null>(null);
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (file: File, dataUrl: string, type: SupportedFileType) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setFileType(type);
    setScannedPages([]);
    setErrorMessage(null);
  };

  const handleMultiPagesSelected = (pages: ScannedPage[]) => {
    setScannedPages(pages);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setErrorMessage(null);
  };

  const handleSampleSelected = (sampleText: string, title: string) => {
    sessionStorage.setItem("docclear_extracted_text", sampleText);
    sessionStorage.setItem("docclear_original_ocr", sampleText);
    sessionStorage.setItem("docclear_filename", title);
    sessionStorage.setItem("docclear_confidence", "0.98");
    router.push("/review");
  };

  const handleStartExtraction = async () => {
    if (!selectedFile && scannedPages.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let extractedText = "";
      let confidence = 0.95;
      let docName = "Document";

      // Case A: Multi-page camera scans (1 to 5 pages)
      if (scannedPages.length > 0) {
        docName = `Scanned Document (${scannedPages.length} ${scannedPages.length === 1 ? "page" : "pages"})`;
        const result = await extractTextFromMultipleImages(scannedPages, (p) => {
          setOcrProgress(p);
        });
        extractedText = result.text;
        confidence = result.confidence;
      }

      // Case B: Single Image File -> Client-Side Tesseract OCR
      else if (fileType === "image" && selectedFile) {
        docName = selectedFile.name;
        if (!previewUrl) throw new Error("Image preview is missing. Please reselect the file.");
        const result = await extractTextFromImage(previewUrl, (p) => {
          setOcrProgress(p);
        });
        extractedText = result.text;
        confidence = result.confidence;
      }

      // Case C: Plain Text File -> Direct text read
      else if (fileType === "text" && selectedFile) {
        docName = selectedFile.name;
        setOcrProgress({
          status: "recognizing",
          progress: 0.5,
          message: "Reading text document...",
        });
        extractedText = await selectedFile.text();
        confidence = 1.0;
      }

      // Case D: PDF or Word Document -> /api/extract-doc endpoint
      else if ((fileType === "pdf" || fileType === "docx") && selectedFile) {
        docName = selectedFile.name;
        setOcrProgress({
          status: "recognizing",
          progress: 0.4,
          message: `Extracting text from ${fileType.toUpperCase()} document...`,
        });

        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/extract-doc", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `Failed to extract text from ${fileType.toUpperCase()} document.`);
        }

        extractedText = data.text;
        confidence = 0.98;
      }

      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error(
          "No readable text could be recognized in this document. Please ensure it contains clear text."
        );
      }

      try {
        sessionStorage.setItem("docclear_extracted_text", extractedText.trim());
        sessionStorage.setItem("docclear_original_ocr", extractedText.trim());
        sessionStorage.setItem("docclear_filename", docName);
        sessionStorage.setItem("docclear_confidence", confidence.toString());
      } catch (storageErr) {
        console.warn("Storage quota warning:", storageErr);
      }

      router.push("/review");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to recognize text. Please upload a clearer document or choose a sample."
      );
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setScannedPages([]);
    setOcrProgress(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8">
      {/* Error Banner with Recovery Action */}
      {errorMessage && (
        <Alert
          type="error"
          title="Document Error"
          action={
            <Button variant="outline" size="small" onClick={() => setErrorMessage(null)}>
              Dismiss
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* Main Hero Section: Left Form & Right Interactive Preview (Matching Image 4) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Heading, Stepper, Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Understand any complex document.
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              Snap it or upload it. Get a plain-language explanation you can read or listen to.
            </p>
          </div>

          {/* Stepper Pills (Matching Image 4) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              1 Upload or snap
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              2 We simplify
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              3 Read or listen
            </span>
          </div>

          {/* Camera & Upload Capture Component */}
          <CameraCapture
            onFileSelected={handleFileSelected}
            onMultiPagesSelected={handleMultiPagesSelected}
            onError={(err) => setErrorMessage(err)}
            selectedFileName={selectedFile?.name}
            selectedFileSize={selectedFile?.size}
            selectedFileType={fileType}
            previewUrl={previewUrl}
            scannedPages={scannedPages}
            onUpdateScannedPages={(pages) => setScannedPages(pages)}
            onClear={handleClear}
          />

          {/* Privacy Pill (Matching Image 4 & Image 2) */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-950 font-medium">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <span>Your document is processed temporarily and never saved without your permission.</span>
          </div>
        </div>

        {/* Right Column: Hero Visual Graphic Card (Matching Image 4) */}
        <div className="hidden lg:block lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md">
            {/* White Card: Tenancy Clause */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tenancy Clause
              </span>
              <p className="text-slate-800 text-sm leading-relaxed font-serif">
                The Tenant shall{" "}
                <mark className="bg-amber-200/90 text-slate-900 px-1 py-0.5 rounded font-medium">
                  remit payment
                </mark>{" "}
                to the Landlord on the first day of each calendar month.
              </p>
              <div className="h-2 bg-slate-100 rounded-full w-3/4" />
            </div>

            {/* Floating Dark Blue Overlapping Card: In Plain Words */}
            <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-2xl shadow-blue-600/30 -mt-6 ml-auto max-w-[280px] relative z-10 space-y-1">
              <span className="text-[10px] font-extrabold text-blue-200 uppercase tracking-widest block">
                In Plain Words
              </span>
              <p className="text-base font-bold text-white leading-snug">
                Pay your rent on the 1st of every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Processing Progress Indicator */}
      {isProcessing && ocrProgress && (
        <div
          role="status"
          aria-live="polite"
          className="bg-white border-2 border-blue-500 rounded-2xl p-5 shadow-md space-y-3 animate-in fade-in max-w-2xl"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
              <span>{ocrProgress.message}</span>
            </span>
            <span className="font-extrabold text-blue-700">{Math.round(ocrProgress.progress * 100)}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, Math.min(100, ocrProgress.progress * 100))}%` }}
              role="progressbar"
              aria-valuenow={Math.round(ocrProgress.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Action Button: Extract Text */}
      {(selectedFile || scannedPages.length > 0) && !isProcessing && (
        <div className="pt-2 max-w-xl">
          <Button
            type="button"
            onClick={handleStartExtraction}
            isLoading={isProcessing}
            leftIcon={<Sparkles className="w-5 h-5 text-amber-300" />}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full text-base py-4 shadow-md min-h-[52px]"
            aria-label="Process and extract text from this document"
          >
            {scannedPages.length > 1
              ? `Extract Text from All ${scannedPages.length} Pages`
              : scannedPages.length === 1
              ? "Extract Text from Scanned Page"
              : "Extract Text from Document"}
          </Button>
        </div>
      )}

      {/* Try a Sample Section (Matching Image 2 and Image 4) */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-slate-900">Try a sample</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SAMPLE_DOCUMENTS.map((doc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleSelected(doc.text, doc.title)}
              className="text-left p-4 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-400 group min-h-[44px] flex flex-col justify-between"
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <strong className={`font-bold block text-sm ${doc.theme} group-hover:underline`}>
                    {doc.title}
                  </strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                    {doc.tag}
                  </span>
                </div>
                <span className="text-xs text-slate-600 leading-normal block">{doc.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom Yellow Advisory Notice (Matching Image 4) */}
      <div
        role="note"
        aria-label="Advisory notice"
        className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 leading-relaxed w-full"
      >
        <strong className="font-bold text-amber-950">Please note:</strong> DocClear is a comprehension aid.
        Always check payments and deadlines against the original document.
      </div>
    </div>
  );
}
