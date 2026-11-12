"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Award, Info, Copy, Download, Save, RotateCcw, ShieldCheck } from "lucide-react";

const QUESTIONS = [
  "I think that I would like to use DocClear frequently.",
  "I found DocClear unnecessarily complex.",
  "I thought DocClear was easy to use.",
  "I think that I would need the support of a technical person to be able to use DocClear.",
  "I found the various functions in DocClear were well integrated.",
  "I thought there was too much inconsistency in DocClear.",
  "I would imagine that most people would learn to use DocClear very quickly.",
  "I found DocClear very cumbersome to use.",
  "I felt very confident using DocClear.",
  "I needed to learn a lot of things before I could get going with DocClear.",
];

const DELEGATION_ITEMS = [
  {
    id: "D1",
    prompt: "I understood how sure DocClear was about what it read from my document.",
  },
  {
    id: "D2",
    prompt: "When DocClear told me to check or correct something, I knew what to do next.",
  },
  {
    id: "D3",
    prompt: "I would check an important date or amount in the original before acting on it.",
  },
];

const SUS_STORAGE_KEY = "docclear_sus_scores";
const DELEGATION_STORAGE_KEY = "docclear_delegation_scores";
const TASK_STORAGE_KEY = "docclear_task_eval";

export const SUSForm: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [delegation, setDelegation] = useState<Record<string, number>>({});
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Restore saved scores from localStorage on mount if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SUS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
        }
      }
      const storedDel = localStorage.getItem(DELEGATION_STORAGE_KEY);
      if (storedDel) {
        const parsedDel = JSON.parse(storedDel);
        if (parsedDel && typeof parsedDel === "object") {
          setDelegation(parsedDel);
        }
      }
    } catch {
      // Local storage unavailable or failed
    }
  }, []);

  const handleSelect = (qIdx: number, val: number) => {
    const updated = { ...answers, [qIdx]: val };
    setAnswers(updated);
    try {
      localStorage.setItem(SUS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSelectDelegation = (id: string, val: number) => {
    const updated = { ...delegation, [id]: val };
    setDelegation(updated);
    try {
      localStorage.setItem(DELEGATION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleResetAll = () => {
    setAnswers({});
    setDelegation({});
    try {
      localStorage.removeItem(SUS_STORAGE_KEY);
      localStorage.removeItem(DELEGATION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setSavedFeedback("Session ratings cleared for next participant.");
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const answeredCount = QUESTIONS.filter((_, i) => typeof answers[i] === "number").length;
  const allSusAnswered = answeredCount === QUESTIONS.length;

  // Standard SUS calculation formula (Brooke, 1996) using rated values (or neutral 3 when incomplete)
  const calculateScore = () => {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const val = answers[i] ?? 3;
      if (i % 2 === 0) {
        sum += val - 1;
      } else {
        sum += 5 - val;
      }
    }
    return Math.round(sum * 2.5 * 10) / 10;
  };

  const score = calculateScore();
  const delegationAnswered = DELEGATION_ITEMS.filter((d) => typeof delegation[d.id] === "number").length;
  const delegationMean =
    delegationAnswered > 0
      ? (
          DELEGATION_ITEMS.reduce((acc, d) => acc + (delegation[d.id] || 0), 0) / delegationAnswered
        ).toFixed(2)
      : "—";

  let adjective = "Pending";
  let grade = "—";
  let badgeColor = "bg-slate-100 text-slate-800 border-slate-300";

  if (allSusAnswered) {
    if (score >= 85) {
      adjective = "Excellent";
      grade = "A+";
      badgeColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
    } else if (score >= 70) {
      adjective = "Good (Acceptable)";
      grade = "B";
      badgeColor = "bg-blue-100 text-blue-900 border-blue-300";
    } else if (score >= 50) {
      adjective = "Marginal / Fair";
      grade = "C";
      badgeColor = "bg-amber-100 text-amber-900 border-amber-300";
    } else {
      adjective = "Poor (Unacceptable)";
      grade = "F";
      badgeColor = "bg-rose-100 text-rose-900 border-rose-300";
    }
  }

  const exportSummaryText = () => {
    let text = `DocClear - HCI Participant Session Export\n`;
    text += `Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}\n`;
    text += `Standard: Brooke (1996) 10-Item SUS + Delegation Items (D1-D3)\n`;
    text += `------------------------------------------------------------\n`;
    text += `SUS COMPOSITE SCORE: ${allSusAnswered ? `${score} / 100 (${grade} - ${adjective})` : `Incomplete (${answeredCount}/10 answered; provisional ${score})`}\n`;
    text += `DELEGATION MEAN (D1-D3, separate from SUS): ${delegationMean} / 5 (${delegationAnswered}/3 rated)\n`;
    text += `------------------------------------------------------------\n`;
    text += `SUS ITEM BREAKDOWN:\n`;
    QUESTIONS.forEach((q, idx) => {
      text += `Q${idx + 1}. ${q} => ${answers[idx] ?? "Unanswered"} / 5\n`;
    });
    text += `\nDELEGATION TRUST & AGENCY ITEMS (D1-D3):\n`;
    DELEGATION_ITEMS.forEach((item) => {
      text += `${item.id}. ${item.prompt} => ${delegation[item.id] ?? "Unanswered"} / 5\n`;
    });

    try {
      const taskRaw = localStorage.getItem(TASK_STORAGE_KEY);
      if (taskRaw) {
        const parsedTasks = JSON.parse(taskRaw) as Record<string, { completed?: boolean; elapsedMs?: number }>;
        text += `\nIN-APP LOGGED TASK TIMES:\n`;
        ["T1", "T2", "T3", "T4", "T5"].forEach((id) => {
          const t = parsedTasks[id];
          const sec = t?.elapsedMs ? (t.elapsedMs / 1000).toFixed(1) : "0.0";
          text += `${id}: ${t?.completed ? "Completed (Y)" : "Not Completed (N)"} | Time: ${sec} s\n`;
        });
      }
    } catch {
      // ignore task export error
    }
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportSummaryText());
      setSavedFeedback("Session score, D1-D3 & task timings copied to clipboard!");
      setTimeout(() => setSavedFeedback(null), 3500);
    } catch {
      setSavedFeedback("Failed to copy automatically.");
    }
  };

  const handleDownload = () => {
    const text = exportSummaryText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DocClear_Evaluation_${allSusAnswered ? score : "draft"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSavedFeedback("Evaluation session exported as .TXT!");
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
            <span className="break-words">System Usability Scale (SUS) &amp; Delegation Instrument</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Rate all 10 SUS items and 3 delegation items (D1–D3) after finishing the tasks. Auto-saved locally per participant.
          </p>
        </div>

        {/* Live Calculated Score Card */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-full sm:w-auto p-3.5 sm:p-4 rounded-xl border flex items-center justify-between sm:justify-start gap-4 ${badgeColor}`}>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider block opacity-75">
                {allSusAnswered ? "SUS Score" : `SUS (${answeredCount}/10)`}
              </span>
              <span className="text-2xl sm:text-3xl font-black">{allSusAnswered ? score : "—"}</span>
              <span className="text-xs font-semibold ml-1">/ 100</span>
            </div>
            <div className="border-l border-current/20 pl-4 text-right sm:text-left">
              <span className="text-sm font-black block">{grade}</span>
              <span className="text-xs font-semibold">{adjective}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons to Reset / Copy / Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="text-xs text-slate-600 flex items-center gap-1.5 min-w-0">
          <Save className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="break-words">
            SUS: <strong>{answeredCount}/10</strong> • D1–D3: <strong>{delegationAnswered}/3</strong> (auto-saved)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg shadow-sm transition-colors min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg shadow-sm transition-colors min-h-[44px]"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Copy</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .TXT</span>
          </button>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Part A: 10 SUS Questions */}
      <div className="space-y-4">
        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
          Part A — Standardized SUS (Questions 1–10)
        </h4>
        {QUESTIONS.map((q, idx) => (
          <div key={idx} className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="font-bold text-xs bg-slate-200 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-snug break-words min-w-0">{q}</p>
            </div>

            <div className="pt-1 sm:ml-8">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-md">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelect(idx, val)}
                    className={`min-h-[44px] h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center transition-all ${
                      answers[idx] === val
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                    aria-label={`Rate ${val} out of 5 for SUS question ${idx + 1}`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium pt-1.5 max-w-md px-1 gap-2">
                <span>1 (Strongly Disagree)</span>
                <span className="text-right">5 (Strongly Agree)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Part B: Delegation & Confidence Items (D1-D3) */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
              <span>Part B — Delegation &amp; Uncertainty Trust (D1–D3)</span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Author-defined items evaluating human-in-the-loop delegation decisions. Scored separately from SUS.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 shrink-0">
            Delegation Mean: {delegationMean} / 5
          </span>
        </div>

        {DELEGATION_ITEMS.map((item) => (
          <div key={item.id} className="p-3.5 sm:p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="font-bold text-xs bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.id}
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-snug break-words min-w-0">{item.prompt}</p>
            </div>

            <div className="pt-1 sm:ml-10">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-md">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectDelegation(item.id, val)}
                    className={`min-h-[44px] h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center transition-all ${
                      delegation[item.id] === val
                        ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-300"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 active:bg-slate-200"
                    }`}
                    aria-label={`Rate ${val} out of 5 for delegation item ${item.id}`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium pt-1.5 max-w-md px-1 gap-2">
                <span>1 (Strongly Disagree)</span>
                <span className="text-right">5 (Strongly Agree)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed break-words">
          <strong>Evaluation Note:</strong> An SUS score around 68 represents the industry mean; scores above 80.3 reflect high perceived usability.{" "}
          {allSusAnswered ? (
            <>
              Current SUS is <strong>{score} / 100 ({grade} – {adjective})</strong>, alongside Delegation Mean{" "}
              <strong>{delegationMean} / 5</strong>.
            </>
          ) : (
            <span>Complete all 10 SUS statements and D1–D3 ratings for this participant, then tap Copy or Export .TXT.</span>
          )}
        </p>
      </div>
    </div>
  );
};
