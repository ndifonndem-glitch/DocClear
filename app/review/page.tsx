"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, AlertCircle, Loader2, WifiOff, Clock } from "lucide-react";
import { TextReviewEditor } from "@/components/review/TextReviewEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { requestSimplification } from "@/services/simplification";

export default function ReviewPage() {
  const router = useRouter();
  const [extractedText, setExtractedText] = useState<string>("");
  const [originalOcr, setOriginalOcr] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0.92);
  const [fileName, setFileName] = useState<string>("Document");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedText = sessionStorage.getItem("docclear_extracted_text");
    const storedOriginal = sessionStorage.getItem("docclear_original_ocr");
    const storedConf = sessionStorage.getItem("docclear_confidence");
    const storedName = sessionStorage.getItem("docclear_filename");

    if (!storedText) {
      // If user navigated directly without scanning a document, redirect home
      router.push("/");
      return;
    }

    setExtractedText(storedText);
    setOriginalOcr(storedOriginal || storedText);
    if (storedConf) setConfidence(parseFloat(storedConf));
    if (storedName) setFileName(storedName);
    setIsLoaded(true);

    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }
  }, [router]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setIsLoading(false);
    setIsSlow(false);
    setLoadingStep(1);
    setErrorMessage("Simplification cancelled by user. You can modify the text and try again.");
  };

  const handleSubmit = async (editedText: string) => {
    setIsLoading(true);
    setIsSlow(false);
    setLoadingStep(1);
    setErrorMessage(null);

    abortControllerRef.current = new AbortController();

    // Trigger step progressions
    stepTimerRef.current = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);

    // Trigger slow notification (> 5s)
    slowTimerRef.current = setTimeout(() => {
      setIsSlow(true);
    }, 5000);

    try {
      const response = await requestSimplification({
        text: editedText,
        readingLevel: "simplified",
      });

      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);

      // Save simplified results for comparison screen
      sessionStorage.setItem("docclear_simplified_result", JSON.stringify(response));
      router.push("/comparison");
    } catch (err) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      // Treat network errors or request failures as the true offline signal
      setIsOffline(true);
      setErrorMessage(
        err instanceof Error
          ? `${err.message} (Network timeout or offline. Local analytical fallback is ready).`
          : "Network request timed out or failed. Please check your connection or use local fallback."
      );
    } finally {
      setIsLoading(false);
      setIsSlow(false);
      setLoadingStep(1);
    }
  };

  if (!isLoaded) {
    return (
      <div className="py-12 text-center text-slate-500 space-y-2">
        <p className="text-sm font-semibold">Loading document review...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-2 min-h-[44px]"
          aria-label="Back to document capture dashboard"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Capture</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <FileText className="w-4 h-4 text-blue-700" aria-hidden="true" />
          <span className="truncate max-w-[200px]">{fileName}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Review & Correct OCR Text</h1>
        <p className="text-sm text-slate-600">
          Ensure all important clauses, figures, and dates are accurately captured before generating the plain-language
          explanation.
        </p>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <Alert
          type="warning"
          title="Offline Mode Active"
          action={
            <Button variant="outline" size="small" onClick={() => setIsOffline(false)}>
              Dismiss
            </Button>
          }
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>You appear to be offline. Local OCR works without internet; AI simplification will use local offline backup.</span>
          </div>
        </Alert>
      )}

      {/* Multi-Step Loading Banner with Cancel if slow */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="bg-blue-50/90 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-blue-950 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>
                {loadingStep === 1 && "Step 1 of 3: Analyzing document structure and clauses..."}
                {loadingStep === 2 && "Step 2 of 3: Simplifying legalese into everyday English..."}
                {loadingStep === 3 && "Step 3 of 3: Extracting timeline, payments, and takeaways..."}
              </span>
            </div>
            <span className="text-xs font-extrabold text-blue-800">
              {Math.round((loadingStep / 3) * 100)}%
            </span>
          </div>

          <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(loadingStep / 3) * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round((loadingStep / 3) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Slow State (> 5 seconds) Notification with Cancel Button */}
          {isSlow && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-200 text-xs text-blue-900">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Simplification is taking longer than usual due to network response...</span>
              </span>
              <Button
                variant="outline"
                size="small"
                onClick={handleCancel}
                className="self-start sm:self-auto min-h-[44px]"
                aria-label="Cancel simplification request"
              >
                Cancel Request
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error state alert if BFF fails with Retry button */}
      {errorMessage && (
        <Alert
          type="error"
          title="Simplification Service Error"
          action={
            <div className="flex items-center gap-2">
              <Button variant="primary" size="small" onClick={() => handleSubmit(extractedText)} className="min-h-[44px]">
                Retry
              </Button>
              <Button variant="outline" size="small" onClick={() => setErrorMessage(null)} className="min-h-[44px]">
                Dismiss
              </Button>
            </div>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* Text Review Editor Component */}
      <TextReviewEditor
        key={extractedText || "loading"}
        initialText={extractedText}
        originalOcrText={originalOcr}
        ocrConfidence={confidence}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/")}
        isLoading={isLoading}
      />
    </div>
  );
}
