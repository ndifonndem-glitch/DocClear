"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { HeuristicItem } from "@/types/evaluation";

const DEFAULT_ITEMS: HeuristicItem[] = [
  {
    id: "H1",
    category: "Visibility",
    title: "Visibility of System Status",
    description: "Clear loading spinners, live OCR recognition percentages, and network state indicators are presented.",
    status: "untested",
  },
  {
    id: "H2",
    category: "Real World Match",
    title: "Match Between System and Real World",
    description: "Plain language explanations avoid dense jargon; dates and payment amounts use familiar regional conventions.",
    status: "untested",
  },
  {
    id: "H3",
    category: "User Control",
    title: "User Control and Freedom",
    description: "Users can inspect, edit, and reset OCR text before simplification (FR-05) and clear current documents at any time (FR-15).",
    status: "untested",
  },
  {
    id: "H4",
    category: "Consistency",
    title: "Consistency and Standards",
    description: "Buttons, typography scales, card layouts, and status colors remain predictable across all application screens.",
    status: "untested",
  },
  {
    id: "H5",
    category: "Error Prevention",
    title: "Error Prevention",
    description: "Camera inputs validate image file formats before submission and prevent duplicate simultaneous requests.",
    status: "untested",
  },
  {
    id: "H6",
    category: "Recognition",
    title: "Recognition Rather Than Recall",
    description: "Original document text remains accessible side-by-side with the simplified version so the user never has to memorize clauses.",
    status: "untested",
  },
  {
    id: "H7",
    category: "Flexibility",
    title: "Flexibility and Efficiency of Use",
    description: "Supports camera capture, file upload, or preloaded realistic samples for rapid testing without physical documents.",
    status: "untested",
  },
  {
    id: "H8",
    category: "Aesthetic",
    title: "Aesthetic and Minimalist Design",
    description: "Clean, clutter-free screens with high whitespace, focused typography, and minimal cognitive load per interaction step.",
    status: "untested",
  },
  {
    id: "H9",
    category: "Error Recovery",
    title: "Help Users Recognize and Recover from Errors",
    description: "Clear, non-technical error alerts explain what failed and provide immediate recovery hints or retry buttons.",
    status: "untested",
  },
  {
    id: "H10",
    category: "Help",
    title: "Help and Documentation",
    description: "Prominent verification disclaimer (FR-11) and difficult vocabulary glossaries are integrated contextually.",
    status: "untested",
  },
  {
    id: "WCAG1",
    category: "Accessibility",
    title: "WCAG 2.2 Target Size (2.5.8 AA ≥ 24px / 2.5.5 AAA ≥ 44px)",
    description: "All interactive buttons and touch targets meet WCAG 2.5.8 Level AA (24x24px) and target 44x44px (WCAG 2.5.5 AAA).",
    status: "untested",
  },
  {
    id: "WCAG2",
    category: "Accessibility",
    title: "WCAG 2.2 AA Contrast & Bypass Blocks (1.4.3 / 2.4.1)",
    description: "Text contrast exceeds 4.5:1; skip-to-content link is provided for keyboard and screen-reader accessibility.",
    status: "untested",
  },
];

const STORAGE_KEY = "docclear_heuristic_checks";

export const HeuristicChecklist: React.FC = () => {
  const [items, setItems] = useState<HeuristicItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, "pass" | "fail" | "untested">;
        if (parsed && typeof parsed === "object") {
          setItems(
            DEFAULT_ITEMS.map((item) => ({
              ...item,
              status:
                parsed[item.id] === "pass" || parsed[item.id] === "fail" || parsed[item.id] === "untested"
                  ? parsed[item.id]
                  : "untested",
            }))
          );
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persist = (nextItems: HeuristicItem[]) => {
    try {
      const map: Record<string, string> = {};
      nextItems.forEach((i) => {
        map[i.id] = i.status;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  };

  const toggleStatus = (id: string) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "pass" ? "fail" : item.status === "fail" ? "untested" : "pass";
          return { ...item, status: nextStatus } as HeuristicItem;
        }
        return item;
      });
      persist(next);
      return next;
    });
  };

  const handleReset = () => {
    setItems(DEFAULT_ITEMS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const passCount = items.filter((i) => i.status === "pass").length;
  const totalCount = items.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 overflow-hidden">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
            <span className="break-words">Nielsen Heuristics & WCAG 2.2 Inspection Tool</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Expert heuristic evaluation checklist for IT8530 Assessment 2 &amp; 3. Tap any status pill to mark Pass, Fail, or Untested.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border ${
              passCount > 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${passCount > 0 ? "text-emerald-600" : "text-slate-500"}`}
              aria-hidden="true"
            />
            <span>
              {passCount} / {totalCount} Criteria Verified
            </span>
          </div>

          {items.some((i) => i.status !== "untested") && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                  {item.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 break-words leading-snug">{item.title}</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">{item.description}</p>
            </div>

            <button
              type="button"
              onClick={() => toggleStatus(item.id)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] min-w-[108px] shrink-0 self-start sm:self-center ${
                item.status === "pass"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : item.status === "fail"
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : "bg-slate-200 text-slate-700 border border-slate-300"
              }`}
              aria-label={`Toggle evaluation status for ${item.title}`}
            >
              {item.status === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              {item.status === "fail" && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              {item.status === "untested" && <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />}
              <span className="capitalize">{item.status}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
