"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Sparkles, BookOpen, ShieldCheck, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { calculateReadability } from "@/lib/readability";

export interface TextReviewEditorProps {
  initialText: string;
  originalOcrText: string;
  ocrConfidence?: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TextReviewEditor: React.FC<TextReviewEditorProps> = ({
  initialText,
  originalOcrText,
  ocrConfidence = 0.9,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [text, setText] = useState(initialText);
  const [metrics, setMetrics] = useState(() => calculateReadability(initialText));

  // Sync state when initialText prop updates from async sessionStorage read
  useEffect(() => {
    setText(initialText);
    setMetrics(calculateReadability(initialText));
  }, [initialText]);

  useEffect(() => {
    setMetrics(calculateReadability(text));
  }, [text]);

  const handleReset = () => {
    setText(originalOcrText);
  };

  const isModified = text !== originalOcrText;

  return (
    <div className="space-y-5">
      {/* OCR Status & Quality Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Scan Quality:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              ocrConfidence >= 0.8
                ? "bg-emerald-100 text-emerald-800"
                : ocrConfidence >= 0.7
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {Math.round(ocrConfidence * 100)}% Confidence
          </span>
          {ocrConfidence < 0.7 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-400">
              Low confidence — verify below
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 min-w-0">
          <span>{metrics.wordCount} words</span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" aria-hidden="true" />
            <span>
              Grade {metrics.fleschKincaidGrade} ({metrics.readingLevelDescription})
            </span>
          </span>
        </div>
      </div>

      {/* Prominent Editable Text Area Guidance (Pilot Finding #1) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="document-text-editor" className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>Inspect &amp; Edit Extracted Text</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Editable
            </span>
          </label>
          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 min-h-[44px] px-2"
              aria-label="Reset to Original Scan"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset to Original Scan</span>
            </button>
          )}
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs sm:text-sm text-amber-950 leading-snug">
          <PencilLine className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="break-words">
            <strong>Tap inside the text box below to edit:</strong> Check dates, dollar amounts, and names before you tap Simplify.
          </p>
        </div>

        <textarea
          id="document-text-editor"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3.5 sm:p-4 text-slate-900 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl leading-relaxed font-sans text-base transition-all resize-y min-h-[200px] shadow-xs"
          aria-describedby="editor-hint"
        />
        <span id="editor-hint" className="sr-only">
          Multiline editable text box containing the document text extracted from your image. You can edit any word.
        </span>
      </div>

      {/* Disclosure & Consent Notice Before Cloud Simplification (NZ Privacy Act IPP 3 & IPP 12) */}
      <div
        role="note"
        aria-label="Privacy disclosure before sending document text"
        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-800 leading-relaxed"
      >
        <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="break-words">
          <strong>Privacy Notice:</strong> To simplify this document, DocClear processes your edited text via our secure BFF / Gemini service (which may process text outside New Zealand). Your raw image stays out of persistent storage. Only submit sample or non-confidential text on free-tier keys.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={() => onSubmit(text)}
          isLoading={isLoading}
          disabled={text.trim().length === 0}
          leftIcon={<Sparkles className="w-5 h-5" />}
          className="w-full sm:flex-1"
          aria-label="Simplify into Plain Language"
        >
          Simplify into Plain Language
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
          aria-label="Back / Cancel"
        >
          Back / Cancel
        </Button>
      </div>
    </div>
  );
};
