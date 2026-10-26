"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, BarChart3, Home, History, Settings, RotateCcw } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLargeText, setIsLargeText] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docclear_text_scale");
    if (saved === "large") {
      setIsLargeText(true);
      document.documentElement.dataset.textScale = "large";
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg p-1 min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm" aria-hidden="true">
              <FileText className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">Doc Clear</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              PWA
            </span>
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
                {/* Font Scaling Toggle (A- A+) */}
                <button
                  type="button"
                  onClick={toggleTextScale}
                  className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] inline-flex items-center justify-center ${
                    isLargeText
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                  aria-label="Toggle text size scale (A- / A+)"
                  title="Toggle accessibility text size"
                >
                  A- A+
                </button>

                {/* Language Indicator */}
                <span className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl min-h-[44px] items-center">
                  English
                </span>

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
            onClick={toggleTextScale}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[48px] gap-0.5 font-semibold text-slate-600 hover:text-slate-900"
            aria-label="Toggle text size scale"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      )}
    </>
  );
};
