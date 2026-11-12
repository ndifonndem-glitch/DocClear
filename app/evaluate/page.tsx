"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  ShieldCheck,
  ListChecks,
  Smartphone,
  Timer,
  Play,
  Square,
  RotateCcw,
  Activity,
} from "lucide-react";
import { SUSForm } from "@/components/evaluation/SUSForm";
import { HeuristicChecklist } from "@/components/evaluation/HeuristicChecklist";
import { SensorDiagnostics } from "@/components/evaluation/SensorDiagnostics";

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
    goal: "Locate the speech player bar, start audio playback, set the speech rate to 0.8x, and pause.",
    targetTime: "< 15 seconds",
    criteria: "Browser reads text aloud; speed button reflects selected playback multiplier.",
  },
  {
    id: "T5",
    title: "Task 5: Handle Needs Review & Delegation Verification",
    goal: "Open /review?fail=low, tap Simplify, and say what DocClear is unsure about and what you would verify next.",
    targetTime: "No time target",
    criteria: "Participant spots the amber Needs Review alert and chooses to verify the original text.",
  },
];

const TASK_STORAGE_KEY = "docclear_task_eval";

interface TaskTimingRecord {
  completed: boolean;
  elapsedMs: number;
}

interface MediaMetricsRecord {
  fileName?: string;
  rawBytes?: number;
  compressedBytes?: number;
  ocrMs?: number;
  uploadMs?: number;
  recordedAt?: string;
}

export default function EvaluatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sus" | "heuristics" | "tasks" | "sensors">("sus");
  const [taskRecords, setTaskRecords] = useState<Record<string, TaskTimingRecord>>({});
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  const [mediaMetrics, setMediaMetrics] = useState<MediaMetricsRecord | null>(null);

  const timerStartRef = useRef<number>(0);
  const baseElapsedRef = useRef<number>(0);

  // Load saved task timings & latest media metrics on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TASK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") setTaskRecords(parsed);
      }
      const rawMedia =
        sessionStorage.getItem("docclear_media_metrics") || localStorage.getItem("docclear_media_metrics");
      if (rawMedia) {
        setMediaMetrics(JSON.parse(rawMedia));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Tick live timer every 100ms while a task is actively timed
  useEffect(() => {
    if (!activeTimerId) return;
    const id = setInterval(() => {
      setLiveElapsedMs(baseElapsedRef.current + (performance.now() - timerStartRef.current));
    }, 100);
    return () => clearInterval(id);
  }, [activeTimerId]);

  const persistTasks = (next: Record<string, TaskTimingRecord>) => {
    setTaskRecords(next);
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const stopRunningTimer = (markComplete: boolean) => {
    if (!activeTimerId) return;
    const finalElapsed = baseElapsedRef.current + (performance.now() - timerStartRef.current);
    const prev = taskRecords[activeTimerId] || { completed: false, elapsedMs: 0 };
    const next = {
      ...taskRecords,
      [activeTimerId]: {
        completed: markComplete ? true : prev.completed,
        elapsedMs: Math.round(finalElapsed),
      },
    };
    persistTasks(next);
    setActiveTimerId(null);
    setLiveElapsedMs(0);
  };

  const handleStartTask = (taskId: string) => {
    if (activeTimerId && activeTimerId !== taskId) {
      stopRunningTimer(false);
    }
    const existing = taskRecords[taskId]?.elapsedMs || 0;
    baseElapsedRef.current = existing;
    timerStartRef.current = performance.now();
    setLiveElapsedMs(existing);
    setActiveTimerId(taskId);
  };

  const handleCompleteTask = (taskId: string) => {
    if (activeTimerId === taskId) {
      stopRunningTimer(true);
      return;
    }
    const prev = taskRecords[taskId] || { completed: false, elapsedMs: 0 };
    persistTasks({
      ...taskRecords,
      [taskId]: { ...prev, completed: !prev.completed },
    });
  };

  const handleResetTask = (taskId: string) => {
    if (activeTimerId === taskId) {
      setActiveTimerId(null);
      setLiveElapsedMs(0);
    }
    const next = { ...taskRecords };
    delete next[taskId];
    persistTasks(next);
  };

  const handleResetAllTasks = () => {
    setActiveTimerId(null);
    setLiveElapsedMs(0);
    persistTasks({});
  };

  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-words">
          DocClear HCI Evaluation Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Standardized usability instrument for Assessment 2 Task 3 &amp; Assessment 3 Task 3.
        </p>
      </div>

      {/* Responsive 2x2 / 4-col Tab Navigation (Never clips at 360px or 200% zoom) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("sus")}
          className={`py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            activeTab === "sus"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-center leading-tight">SUS + D1–D3</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("heuristics")}
          className={`py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            activeTab === "heuristics"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-center leading-tight">Heuristics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            activeTab === "tasks"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListChecks className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-center leading-tight">5 Tasks &amp; Timer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sensors")}
          className={`py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 min-h-[48px] transition-colors ${
            activeTab === "sensors"
              ? "border-blue-600 text-blue-700 bg-blue-50/40"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-center leading-tight">Sensors</span>
        </button>
      </div>

      {/* Tab 1: System Usability Scale + D1-D3 */}
      {activeTab === "sus" && <SUSForm />}

      {/* Tab 2: Heuristic & WCAG Checklist */}
      {activeTab === "heuristics" && <HeuristicChecklist />}

      {/* Tab 3: 5-Task Protocol with Automatic In-App Stopwatch Timer */}
      {activeTab === "tasks" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <span className="break-words">5 Representative Tasks &amp; Built-In Task Timer</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Tap Start when a participant begins a task, then tap Done to log exact elapsed time automatically.
              </p>
            </div>

            {Object.keys(taskRecords).length > 0 && (
              <button
                type="button"
                onClick={handleResetAllTasks}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl min-h-[44px] self-start sm:self-auto shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Timers</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {TASKS.map((t) => {
              const record = taskRecords[t.id] || { completed: false, elapsedMs: 0 };
              const isRunning = activeTimerId === t.id;
              const displayMs = isRunning ? liveElapsedMs : record.elapsedMs;

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all min-w-0 overflow-hidden ${
                    isRunning
                      ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-100"
                      : record.completed
                      ? "bg-emerald-50/50 border-emerald-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                    <div className="min-w-0 space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 break-words">{t.title}</h4>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        <Timer className="w-3 h-3" aria-hidden="true" />
                        Target: {t.targetTime}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto min-w-0">
                      <span
                        className="font-mono text-xs font-bold px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 min-w-[74px] text-center"
                        aria-live={isRunning ? "polite" : "off"}
                      >
                        {formatDuration(displayMs)}
                      </span>

                      {!isRunning ? (
                        <button
                          type="button"
                          onClick={() => handleStartTask(t.id)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white"
                          aria-label={`Start timer for ${t.title}`}
                        >
                          <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{record.elapsedMs > 0 ? "Resume" : "Start"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(t.id)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
                          aria-label={`Stop timer and mark ${t.title} completed`}
                        >
                          <Square className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Stop &amp; Done</span>
                        </button>
                      )}

                      {!isRunning && (
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(t.id)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg min-h-[44px] transition-colors ${
                            record.completed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {record.completed ? "Completed (Y)" : "Mark Done"}
                        </button>
                      )}

                      {(record.elapsedMs > 0 || record.completed) && !isRunning && (
                        <button
                          type="button"
                          onClick={() => handleResetTask(t.id)}
                          className="text-xs font-semibold px-2.5 py-2 rounded-lg min-h-[44px] bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                          aria-label={`Reset timer for ${t.title}`}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 space-y-1 text-xs text-slate-600 leading-relaxed">
                    <p className="break-words">
                      <strong className="text-slate-800">Scenario Goal:</strong> {t.goal}
                    </p>
                    <p className="break-words">
                      <strong className="text-slate-800">Success Criteria:</strong> {t.criteria}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Media Performance Telemetry Card (Supports Assessment 3 Media Log) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>Latest Media &amp; Pipeline Timing Log</span>
            </h4>
            {mediaMetrics ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="text-slate-500 block text-[11px]">Raw Input Size</span>
                  <strong className="text-slate-900 font-mono break-words">{formatBytes(mediaMetrics.rawBytes)}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="text-slate-500 block text-[11px]">Re-encoded JPEG</span>
                  <strong className="text-slate-900 font-mono break-words">{formatBytes(mediaMetrics.compressedBytes)}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="text-slate-500 block text-[11px]">OCR Duration</span>
                  <strong className="text-slate-900 font-mono break-words">
                    {mediaMetrics.ocrMs !== undefined ? `${mediaMetrics.ocrMs} ms` : "—"}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 min-w-0">
                  <span className="text-slate-500 block text-[11px]">Analyse API Time</span>
                  <strong className="text-slate-900 font-mono break-words">
                    {mediaMetrics.uploadMs !== undefined ? `${mediaMetrics.uploadMs} ms` : "—"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Scan or upload an image document and run Simplify to populate real media size, OCR, and API timing metrics here.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Mobile Device Sensor Diagnostics */}
      {activeTab === "sensors" && <SensorDiagnostics />}
    </div>
  );
}
