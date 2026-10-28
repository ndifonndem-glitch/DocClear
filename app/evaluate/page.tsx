"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, ShieldCheck, ListChecks, Smartphone, Timer, CheckCircle } from "lucide-react";
import { SUSForm } from "@/components/evaluation/SUSForm";
import { HeuristicChecklist } from "@/components/evaluation/HeuristicChecklist";
import { SensorDiagnostics } from "@/components/evaluation/SensorDiagnostics";
import { Button } from "@/components/ui/Button";

const TASKS = [
  {
    id: "T1",
    title: "Task 1: Capture or Load Document",
    goal: "Navigate to the dashboard and load a sample tenancy agreement or document image.",
    targetTime: "< 15 seconds",
    criteria: "Image preview renders with file name and extraction button.",
  },
  {
    id: "T2",
    title: "Task 2: Inspect & Correct Extracted OCR Text",
    goal: "Review the extracted text on /review, find a date or amount, and edit it before submitting.",
    targetTime: "< 30 seconds",
    criteria: "Text editor reflects user edits; word count and reading grade update dynamically.",
  },
  {
    id: "T3",
    title: "Task 3: Compare Original vs Simplified",
    goal: "Examine the simplified plain language beside the original text; toggle between Side-by-Side and Tabbed views.",
    targetTime: "< 20 seconds",
    criteria: "Reading grade reduction badge is visible; key points summary highlights dates.",
  },
  {
    id: "T4",
    title: "Task 4: Discover & Operate Text-to-Speech",
    goal: "Locate the speech player bar, start audio playback, change speech rate to 0.8x, and pause.",
    targetTime: "< 15 seconds",
    criteria: "Browser reads text aloud; speed button reflects selected playback multiplier.",
  },
];

export default function EvaluatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sus" | "heuristics" | "tasks" | "sensors">("sus");
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-1 min-h-[44px]"
          aria-label="Back to document dashboard"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to App</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
          IT8530 HCI Evaluation Tool
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">DocClear HCI Evaluation Dashboard</h1>
        <p className="text-sm text-slate-600">
          Standardized usability instrument for Assessment 2 Task 3 & Assessment 3 Task 3.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("sus")}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-2 min-h-[48px] transition-colors ${
            activeTab === "sus"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">SUS Scale (10-Item)</span>
          <span className="sm:hidden">SUS (10-Item)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("heuristics")}
          className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] transition-colors ${
            activeTab === "heuristics"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Nielsen & WCAG Checklist</span>
          <span className="sm:hidden">Heuristics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] transition-colors ${
            activeTab === "tasks"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListChecks className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Task-Based Evaluation</span>
          <span className="sm:hidden">Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sensors")}
          className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] transition-colors ${
            activeTab === "sensors"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Device Sensors (Diagnostics)</span>
          <span className="sm:hidden">Sensors</span>
        </button>
      </div>

      {/* Tab 1: System Usability Scale */}
      {activeTab === "sus" && <SUSForm />}

      {/* Tab 2: Heuristic & WCAG Checklist */}
      {activeTab === "heuristics" && <HeuristicChecklist />}

      {/* Tab 3: Task-Based Protocol */}
      {activeTab === "tasks" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span>4 Core User Testing Scenarios</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocol for collecting empirical task completion rate and time-on-task metrics during usability sessions.
            </p>
          </div>

          <div className="space-y-4">
            {TASKS.map((t) => {
              const isDone = !!completedTasks[t.id];
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                    <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Target: {t.targetTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleTask(t.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg min-h-[36px] transition-colors ${
                          isDone ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {isDone ? "Completed" : "Mark Done"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1 text-xs text-slate-600">
                    <p>
                      <strong className="text-slate-800">Scenario Goal:</strong> {t.goal}
                    </p>
                    <p>
                      <strong className="text-slate-800">Success Criteria:</strong> {t.criteria}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Mobile Device Sensor Diagnostics */}
      {activeTab === "sensors" && <SensorDiagnostics />}
    </div>
  );
}
