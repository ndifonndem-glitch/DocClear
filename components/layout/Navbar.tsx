"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, BarChart3, Home, History, Settings, RotateCcw, X, Volume2, Type, Trash2, ShieldCheck, Check } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLargeText, setIsLargeText] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [clearedNotice, setClearedNotice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docclear_text_scale");
    if (saved === "large") {
      setIsLargeText(true);
      document.documentElement.dataset.textScale = "large";
    }
    const savedRate = localStorage.getItem("docclear_speech_rate");
    if (savedRate) {
      setSpeechRate(parseFloat(savedRate));
    }
  }, []);

  const toggleTextScale = () => {
    const next = !isLargeText;
    setIsLargeText(next);
    if (next) {
      document.documentElement.dataset.textScale = "large";
      localStorage.setItem("docclear_text_scale", "large");
    } else {
      document.documentElement.dataset.textScale = "normal";
      localStorage.setItem("docclear_text_scale", "normal");
    }
  };

  const handleSetSpeechRate = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem("docclear_speech_rate", rate.toString());
  };

  const handleClearData = () => {
    sessionStorage.clear();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  const isComparisonPage = pathname === "/comparison" || pathname === "/review";

  const handleStartOver = () => {
    sessionStorage.removeItem("docclear_extracted_text");
    sessionStorage.removeItem("docclear_original_ocr");
    sessionStorage.removeItem("docclear_simplified_result");
    sessionStorage.removeItem("docclear_filename");
    sessionStorage.removeItem("docclear_confidence");
    router.push("/");
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg p-1 min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm" aria-hidden="true">
              <FileText className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">Doc Clear</span>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {isComparisonPage ? (
              <button
                type="button"
                onClick={handleStartOver}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] inline-flex items-center justify-center"
                aria-label="Start over with a new document"
              >
                Start over
              </button>
            ) : (
              <>
                {/* Evaluation Link (Visible in top bar on tablet/desktop; on mobile it is in the bottom nav) */}
                <Link
                  href="/evaluate"
                  className="hidden sm:inline-flex px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50/50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] items-center justify-center"
                  aria-label="HCI Evaluation"
                >
                  Evaluation
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Hidden on Comparison screen to prevent player overlap) */}
      {!isComparisonPage && (
        <nav
          aria-label="Mobile Navigation"
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] gap-0.5 font-semibold ${
              pathname === "/" ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={() => router.push("/review")}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] gap-0.5 font-semibold ${
              pathname === "/review" ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-5 h-5" />
            <span>Review</span>
          </button>

          <Link
            href="/evaluate"
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] gap-0.5 font-semibold ${
              pathname === "/evaluate" ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Evaluation</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] gap-0.5 font-semibold ${
              isSettingsOpen ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
            }`}
            aria-label="Open App Settings"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      )}

      {/* Settings Mobile Drawer / Bottom Modal */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-heading"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity animate-in fade-in duration-150"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" aria-hidden="true" />
                <h2 id="settings-heading" className="text-base font-bold text-slate-900">
                  Settings & Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* 1. Accessibility Text Scale */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-blue-600" />
                  Text Legibility Scale (WCAG 1.4.4)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isLargeText) toggleTextScale();
                    }}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                      !isLargeText
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {!isLargeText && <Check className="w-4 h-4 text-blue-600" />}
                    Standard (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLargeText) toggleTextScale();
                    }}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                      isLargeText
                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isLargeText && <Check className="w-4 h-4 text-blue-600" />}
                    Large (125%)
                  </button>
                </div>
              </div>

              {/* 2. Text-to-Speech Playback Speed */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  Speech Reading Speed (TTS)
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: "0.8x Slow", val: 0.8 },
                    { label: "1.0x Normal", val: 1.0 },
                    { label: "1.2x Fast", val: 1.2 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleSetSpeechRate(item.val)}
                      className={`px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center gap-1 ${
                        speechRate === item.val
                          ? "bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {speechRate === item.val && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Session & Privacy Storage */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  Privacy & Data Cache
                </label>
                <p className="text-xs text-slate-600 mt-1 mb-2.5">
                  Clear temporary extracted text and active documents from this browser session.
                </p>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  Clear Session Cache
                </button>
                {clearedNotice && (
                  <p className="text-xs text-emerald-600 font-medium text-center mt-2 animate-in fade-in">
                    ✓ Cache cleared successfully
                  </p>
                )}
              </div>

              {/* 4. App Info & Accessibility Badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  DocClear Mobile PWA • v1.0.0
                </div>
                <p className="text-[11px] text-slate-500">
                  WCAG 2.2 Level AA Accessible • Deterministic Offline AI Fallback • IT8530
                </p>
              </div>
            </div>

            {/* Footer Done Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
