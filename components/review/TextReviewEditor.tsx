"use client";

import React, { useState, useEffect } from "react";
import { Check, RotateCcw, Sparkles, BookOpen } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Scan Quality:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              ocrConfidence >= 0.8
                ? "bg-emerald-100 text-emerald-800"
                : ocrConfidence >= 0.6
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {Math.round(ocrConfidence * 100)}% Confidence
          </span>
          {ocrConfidence < 0.8 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
              Check this
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-700">
          <span>{metrics.wordCount} words</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
            Grade {metrics.fleschKincaidGrade} ({metrics.readingLevelDescription})
          </span>
        </div>
      </div>

      {/* Editable Text Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="document-text-editor" className="font-bold text-slate-900 text-base">
            Inspect & Correct Document Text
          </label>
          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 min-h-[44px] px-2"
              aria-label="Reset text back to original scanned text"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset to Original Scan</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600">
          Fix any misspelled names, numbers, or dates before sending to the AI simplification service.
        </p>

        <textarea
          id="document-text-editor"
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 text-slate-900 bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl leading-relaxed font-sans text-base transition-all resize-y min-h-[200px]"
          aria-describedby="editor-hint"
        />
        <span id="editor-hint" className="sr-only">
          Multiline text box containing the document text extracted from your image. You can edit any word.
        </span>
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
          aria-label="Submit verified text for plain-language simplification"
        >
          Simplify into Plain Language
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
          aria-label="Cancel and return to document capture"
        >
          Back / Cancel
        </Button>
      </div>
    </div>
  );
};
