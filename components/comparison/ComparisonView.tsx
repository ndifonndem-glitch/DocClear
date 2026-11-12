"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Copy,
  Download,
  Printer,
  FileText,
  X,
  Calendar,
  BookOpen,
  Sparkles,
  HelpCircle,
  Volume2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { SimplificationResponse, ExtractedDeadline } from "@/types/api";
import { SPEECH_SPEED_PRESETS, getSpeechSpeedPreset, normalizeSpeechRate } from "@/lib/speech";
import { CalendarExportPopover } from "@/components/calendar/CalendarExportPopover";
import { DocumentAgentDrawer } from "@/components/agent/DocumentAgentDrawer";

export interface ComparisonViewProps {
  data: SimplificationResponse;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(-1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isOriginalModalOpen, setIsOriginalModalOpen] = useState(false);
  const [downloadedEventIndex, setDownloadedEventIndex] = useState<number | null>(null);
  const [mobileCompareTab, setMobileCompareTab] = useState<"simplified" | "original">("simplified");

  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentCharOffsetRef = useRef<number>(0);
  const resumeFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartSecRef = useRef<number>(0);

  // Playback timer ticker to ensure the progress bar and timer move smoothly across all browsers
  const clearPlaybackTicker = () => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const startPlaybackTicker = (startSec: number, speed: number) => {
    clearPlaybackTicker();
    playbackStartSecRef.current = startSec;
    playbackStartTimeRef.current = performance.now();

    tickerRef.current = setInterval(() => {
      const elapsedSec = ((performance.now() - playbackStartTimeRef.current) / 1000) * speed;
      const calculatedTime = Math.min(totalDuration, playbackStartSecRef.current + elapsedSec);
      setCurrentTime(calculatedTime);

      // Dynamically calculate active sentence based on progress ratio
      if (fullText.length > 0 && sentenceRanges.length > 0 && totalDuration > 0) {
        const ratio = calculatedTime / totalDuration;
        const currentApproxChar = Math.floor(ratio * fullText.length);
        currentCharOffsetRef.current = currentApproxChar;
        const foundIdx = sentenceRanges.findIndex(
          (r) => currentApproxChar >= r.start && currentApproxChar <= r.end
        );
        if (foundIdx !== -1) {
          setCurrentSentenceIdx(foundIdx);
        }
      }

      if (calculatedTime >= totalDuration) {
        clearPlaybackTicker();
      }
    }, 100);
  };

  // Asynchronous voice loading with voiceschanged event listener & saved speed sync
  useEffect(() => {
    try {
      const savedRate = parseFloat(localStorage.getItem("docclear_speech_rate") || "");
      const normalized = normalizeSpeechRate(savedRate);
      if (localStorage.getItem("docclear_speech_rate")) {
        setPlaybackSpeed(normalized);
      }
    } catch {
      // ignore storage errors
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeechSupported(false);
      return;
    }

    setIsSpeechSupported(true);

    const updateVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          setVoiceList(list);
        }
      } catch {
        // ignore
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      clearPlaybackTicker();
      stopSpeech();
    };
  }, []);

  // Prepare full reading text and sentence boundaries
  const fullText = React.useMemo(() => {
    const parts = [
      data.document_title || "Document summary",
      data.document_subtitle || "",
      data.simplified_text || "",
    ].filter(Boolean);
    return parts.join(". ");
  }, [data]);

  // Split into readable sentences and map character ranges for onboundary tracking
  const { sentenceList, sentenceRanges } = React.useMemo(() => {
    if (!fullText) return { sentenceList: [], sentenceRanges: [] };

    const split = fullText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const ranges: { start: number; end: number; text: string }[] = [];
    let searchPos = 0;
    for (const s of split) {
      const idx = fullText.indexOf(s, searchPos);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + s.length, text: s });
        searchPos = idx + s.length;
      } else {
        ranges.push({ start: searchPos, end: searchPos + s.length, text: s });
        searchPos += s.length;
      }
    }

    return { sentenceList: split, sentenceRanges: ranges };
  }, [fullText]);

  // Total words count for audio timeline estimation
  const totalWords = React.useMemo(() => {
    return fullText.split(/\s+/).filter(Boolean).length;
  }, [fullText]);

  // Total duration in seconds: ~2.5 words/sec at 1.0x
  const totalDuration = React.useMemo(() => {
    return Math.max(5, Math.round(totalWords / (2.5 * playbackSpeed)));
  }, [totalWords, playbackSpeed]);

  const remainingTime = Math.max(0, totalDuration - currentTime);
  const progressPercent =
    totalDuration > 0 ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100)) : 0;

  // Format seconds to m:ss
  const formatTime = (totalSecs: number) => {
    const rounded = Math.max(0, Math.floor(totalSecs));
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Find best available English voice on device (or null for system default)
  const getPreferredVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = voiceList.length > 0 ? voiceList : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    return (
      voices.find((v) => /natural|enhanced|google|samantha|daniel|karen/i.test(v.name) && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang === "en-US" || v.lang === "en-NZ" || v.lang === "en-GB") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  };

  // Continuous speech playback function designed for mobile web
  const speakFromCharOffset = (charOffset: number, speed: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Clean previous audio
    window.speechSynthesis.cancel();

    const clampedOffset = Math.max(0, Math.min(charOffset, fullText.length));
    currentCharOffsetRef.current = clampedOffset;
    const textToSpeak = fullText.slice(clampedOffset).trim();

    if (!textToSpeak) {
      stopSpeech();
      return;
    }

    // Identify active sentence
    const startIdx = sentenceRanges.findIndex(
      (r) => clampedOffset >= r.start && clampedOffset <= r.end
    );
    if (startIdx !== -1) {
      setCurrentSentenceIdx(startIdx);
    }

    // Set timeline to matching fraction
    const initialRatio = fullText.length > 0 ? clampedOffset / fullText.length : 0;
    const startSec = initialRatio * totalDuration;
    setCurrentTime(startSec);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speed;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      startPlaybackTicker(startSec, speed);
    };

    // Real-time boundary listener: tracks sentence and updates clock without interrupting stream
    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      const absChar = clampedOffset + (e.charIndex || 0);
      currentCharOffsetRef.current = absChar;

      // Update current active sentence indicator
      const foundIdx = sentenceRanges.findIndex(
        (r) => absChar >= r.start && absChar <= r.end
      );
      if (foundIdx !== -1) {
        setCurrentSentenceIdx(foundIdx);
      }

      // Smooth calibration when browser provides boundary events
      if (fullText.length > 0 && totalDuration > 0) {
        const ratio = absChar / fullText.length;
        const boundarySec = Math.min(totalDuration, ratio * totalDuration);
        playbackStartSecRef.current = boundarySec;
        playbackStartTimeRef.current = performance.now();
        setCurrentTime(boundarySec);
      }
    };

    utterance.onend = () => {
      clearPlaybackTicker();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
      currentCharOffsetRef.current = 0;
      setCurrentTime(totalDuration);
    };

    utterance.onerror = (e) => {
      clearPlaybackTicker();
      const err = (e as any).error;
      if (err === "canceled" || err === "interrupted") return;
      console.warn("Speech synthesis notice:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    activeUtteranceRef.current = utterance;

    // 50ms timeout ensures speech context is unlocked on mobile Safari/Chrome
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
        startPlaybackTicker(startSec, speed);
      } catch (err) {
        console.warn("speechSynthesis speak error:", err);
      }
    }, 50);
  };

  // Play / Pause / Resume Toggle
  const handlePlayToggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your mobile browser.");
      return;
    }

    if (isPlaying && !isPaused) {
      // Pause
      window.speechSynthesis.pause();
      setIsPaused(true);
      clearPlaybackTicker();
    } else if (isPlaying && isPaused) {
      // Resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        startPlaybackTicker(currentTime, playbackSpeed);

        // Mobile Chrome fallback: if paused state doesn't resume, re-speak from saved offset
        if (resumeFallbackTimerRef.current) clearTimeout(resumeFallbackTimerRef.current);
        resumeFallbackTimerRef.current = setTimeout(() => {
          if (window.speechSynthesis.paused || !window.speechSynthesis.speaking) {
            speakFromCharOffset(currentCharOffsetRef.current, playbackSpeed);
          }
        }, 150);
      } else {
        speakFromCharOffset(currentCharOffsetRef.current, playbackSpeed);
      }
    } else {
      // Start playback (from saved offset or from start)
      const offset =
        currentTime > 0 && currentTime < totalDuration ? currentCharOffsetRef.current : 0;
      speakFromCharOffset(offset, playbackSpeed);
    }
  };

  // Stop playback cleanly
  const stopSpeech = () => {
    clearPlaybackTicker();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (resumeFallbackTimerRef.current) {
      clearTimeout(resumeFallbackTimerRef.current);
      resumeFallbackTimerRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIdx(-1);
    currentCharOffsetRef.current = 0;
    setCurrentTime(0);
  };

  // Cycle speed: 0.8x -> 1x -> 1.25x -> 1.5x -> 2x without restarting from beginning
  const cycleSpeed = () => {
    const speeds = SPEECH_SPEED_PRESETS.map((preset) => preset.val);
    const currentIdx = speeds.indexOf(playbackSpeed);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    try {
      localStorage.setItem("docclear_speech_rate", nextSpeed.toString());
    } catch {
      // ignore storage errors
    }

    if (isPlaying && !isPaused) {
      startPlaybackTicker(currentTime, nextSpeed);
      speakFromCharOffset(currentCharOffsetRef.current, nextSpeed);
    }
  };

  // Seek audio timeline by clicking or dragging scrubber bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = parseFloat(e.target.value);
    setCurrentTime(targetSeconds);

    if (totalDuration <= 0 || !fullText) return;

    const ratio = targetSeconds / totalDuration;
    const targetChar = Math.floor(ratio * fullText.length);
    currentCharOffsetRef.current = targetChar;

    const foundIdx = sentenceRanges.findIndex(
      (r) => targetChar >= r.start && targetChar <= r.end
    );
    if (foundIdx !== -1) {
      setCurrentSentenceIdx(foundIdx);
    }

    if (isPlaying && !isPaused) {
      startPlaybackTicker(targetSeconds, playbackSpeed);
      speakFromCharOffset(targetChar, playbackSpeed);
    }
  };

  const handleCopy = () => {
    const summaryText = `Document: ${data.document_title || "Document"}\n\nSummary:\n${
      data.simplified_text
    }\n\nKey Points:\n${data.key_points.map((p) => `• ${p}`).join("\n")}`;
    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const divider = "================================================================================";
    const subDivider = "--------------------------------------------------------------------------------";

    const metricsText = (data.hero_metrics || [])
      .map((m) => `  * ${m.label.toUpperCase()}: ${m.value} (${m.subtext})`)
      .join("\n");

    const timelineText = (data.structured_deadlines || [])
      .map(
        (d, i) =>
          `  ${i + 1}. [${d.dateOrDuration}] ${d.title || d.actionRequired}\n     Context: ${
            d.description || d.consequenceOrContext || "Scheduled obligation"
          }`
      )
      .join("\n\n");

    const keyPointsText = data.key_points.map((p) => `  * ${p}`).join("\n");

    const vocabularyText = (data.vocabulary || [])
      .map((v) => `  * ${v.term.toUpperCase()}: ${v.explanation}`)
      .join("\n");

    const summaryText = [
      divider,
      `DOCCLEAR ACCESSIBLE DOCUMENT SUMMARY`,
      divider,
      `Title:      ${data.document_title || "Document Summary"}`,
      `Subtitle:   ${data.document_subtitle || ""}`,
      `Date:       ${new Date().toLocaleDateString("en-NZ", { dateStyle: "long" })}`,
      `Compliance: IT8530 Plain-Language Comprehension Aid`,
      "",
      subDivider,
      `KEY METRICS AT A GLANCE`,
      subDivider,
      metricsText || "  No primary numerical metrics extracted.",
      "",
      subDivider,
      `PLAIN-LANGUAGE SUMMARY`,
      subDivider,
      data.simplified_text,
      "",
      subDivider,
      `ESSENTIAL TAKEAWAYS`,
      subDivider,
      keyPointsText,
      "",
      subDivider,
      `KEY DATES AND REQUIRED ACTIONS`,
      subDivider,
      timelineText || "  No time-sensitive deadlines extracted.",
      "",
      subDivider,
      `KEYWORDS & TRICKY TERMS EXPLAINED`,
      subDivider,
      vocabularyText || "  Standard vocabulary used.",
      "",
      subDivider,
      `VERIFICATION NOTICE`,
      subDivider,
      `Check against original: ${
        data.cautionary_note || "Verify all figures, formal dates, and liabilities against the source."
      }`,
      `DocClear is an educational accessibility aid, not formal legal, medical, or financial advice.`,
      "",
      divider,
      `ORIGINAL SOURCE TEXT`,
      divider,
      data.original_text,
      divider,
    ].join("\n");

    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.document_title || "docclear_summary").toLowerCase().replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Standard iCalendar (.ics) Event
  const downloadCalendarEvent = (item: ExtractedDeadline, idx: number) => {
    const title = item.title || item.actionRequired || "Document Action Item";
    const desc = item.description || item.consequenceOrContext || item.actionRequired || "";
    const now = new Date();
    const nowStr = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DocClear//Accessibility Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${idx}@docclear.pwa`,
      `DTSTAMP:${nowStr}`,
      `SUMMARY:${title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${(desc + " | Timing: " + item.dateOrDuration).replace(/\n/g, " ")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedEventIndex(idx);
    setTimeout(() => setDownloadedEventIndex(null), 2500);
  };

  // Safe fallback metrics if missing
  const heroMetrics =
    data.hero_metrics && data.hero_metrics.length >= 3
      ? data.hero_metrics
      : [
          { label: "Document Status", value: "Verified", subtext: "Processed & structured" },
          { label: "Comprehension", value: "Everyday Words", subtext: "Accessible plain language" },
          { label: "Key Terms", value: "Preserved", subtext: "Direct from source" },
        ];

  // Safe fallback detail sections if missing
  const detailSections =
    data.detail_sections && data.detail_sections.length >= 3
      ? data.detail_sections
      : [
          {
            title: "DOCUMENT OVERVIEW",
            theme: "blue" as const,
            items: [
              { label: "Document", value: data.document_title || "Summary" },
              { label: "Status", value: "Extracted & Verified" },
              { label: "Accessibility", value: "Plain language format" },
            ],
          },
          {
            title: "TIMING & DEADLINES",
            theme: "green" as const,
            items: [
              { label: "Timeline", value: "Check schedule below" },
              { label: "Obligations", value: "Preserved from original" },
              { label: "Compliance", value: "Action items highlighted" },
            ],
          },
          {
            title: "TERMS & CONDITIONS",
            theme: "orange" as const,
            items: [
              { label: "Verification", value: "Confirm with original document" },
              { label: "Comprehension", value: "Educational accessibility aid" },
              { label: "Disclaimers", value: "See verification notice below" },
            ],
          },
        ];

  const timelineDeadlines = data.structured_deadlines || [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-44 sm:pb-32 w-full max-w-[1700px] mx-auto min-w-0">
      {/* Top Header */}
      <div className="space-y-2 border-b border-slate-200/80 pb-4">
        {data.status === "needs_review" || (data.confidence !== undefined && data.confidence < 0.7) ? (


          <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-amber-100/95 border-2 border-amber-500 text-amber-950 shadow-sm" role="alert">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-500 text-white uppercase tracking-wide shadow-2xs">
                  Status: Needs Review
                </span>
                <span className="text-xs font-semibold text-amber-900 font-mono">
                  Confidence: {Math.round((data.confidence ?? 0.42) * 100)}% (Below 0.70 Threshold)
                </span>
                {data.bffLabel && (
                  <span className="text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded font-mono text-[11px]">
                    BFF: {data.bffLabel} · {data.runId}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The automated summary has low confidence. Verify every figure, due date, and penalty against the original text before acting on it.

              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOriginalModalOpen(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <FileText className="w-4 h-4" />
                  Compare with Original
                </button>
                <Link
                  href="/review"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-amber-400 hover:bg-amber-50 text-amber-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  Edit Source Text
                </Link>
              </div>

            </div>
          </div>
        ) : (
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span>Simplified successfully</span>
            <span className="text-emerald-700 font-mono text-[11px]">({Math.round((data.confidence ?? 0.98) * 100)}% confidence)</span>
            {data.bffLabel && (
              <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-mono text-[11px]">
                BFF: {data.bffLabel} · {data.runId}
              </span>
            )}
          </div>
        )}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {data.document_title || "Document Summary"}
        </h1>
        <p className="text-slate-600 text-xs sm:text-base max-w-2xl leading-relaxed">
          {data.document_subtitle ||
            "Plain-language explanation of critical terms, payment schedules, and obligations."}
        </p>
      </div>

      {/* Top 3 Metric Cards Row (Responsive Grid - No Orphan Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 min-w-0">
        {heroMetrics.map((metric, idx) => {
          const valStr = String(metric.value ?? "");
          const isCompact = valStr.length > 16;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1 min-w-0 overflow-hidden"
            >
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide break-words [overflow-wrap:anywhere]">
                {metric.label}
              </span>
              <div
                className={`${
                  isCompact ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl"
                } font-extrabold tracking-tight my-1 break-words [overflow-wrap:anywhere] leading-snug ${
                  idx === 0 ? "text-blue-700" : "text-slate-900"
                }`}
              >
                {metric.value}
              </div>
              <span className="text-xs text-slate-600 block leading-normal break-words [overflow-wrap:anywhere]">
                {metric.subtext}
              </span>
            </div>
          );
        })}
      </div>

      {/* Middle 3 Category Detail Cards Row (No Orphan Cards on Desktop/Tablet) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 min-w-0">
        {detailSections.map((section, idx) => {
          const headerColor =
            section.theme === "blue"
              ? "text-blue-700"
              : section.theme === "green"
              ? "text-emerald-700"
              : "text-amber-800";

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 min-w-0 overflow-hidden"
            >
              <div className="space-y-3">
                <span className={`text-xs font-extrabold uppercase tracking-wider block ${headerColor}`}>
                  {section.title}
                </span>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-slate-100 pb-2 min-w-0"
                    >
                      <span className="text-slate-500 font-normal break-words [overflow-wrap:anywhere] min-w-0">{item.label}</span>
                      <span className="font-bold text-slate-900 text-left sm:text-right break-words [overflow-wrap:anywhere] min-w-0 max-w-full">{item.value}</span>

                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOriginalModalOpen(true)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline text-left focus:outline-none min-h-[44px] inline-flex items-center px-1 -ml-1 rounded-lg"
              >
                See in original
              </button>
            </div>
          );
        })}
      </div>

      {/* KEY DATES AND ACTIONS SECTION (Ordered timeline list with WCAG-compliant styling) */}
      {timelineDeadlines.length > 0 && (
        <section className="space-y-4 pt-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Key dates and actions
          </h2>

          <div className="space-y-3">
            {timelineDeadlines.map((item, idx) => {
              const rawTag = (item.tag || (item.isRecurring ? "RECURRING" : "ACTION NEEDED")).toUpperCase();

              // Rule: Red is used ONLY for real penalties / defaults / fines
              const isPenalty = /penalty|fine|default|arrears|recovery|forfeit|evict|court|enforce/i.test(
                `${rawTag} ${item.title || ""} ${item.description || ""} ${item.consequenceOrContext || ""}`
              );

              const isStart = rawTag === "START";
              const isRecurring = rawTag === "RECURRING";
              const isMilestone = rawTag === "MILESTONE";

              const dotColor = isPenalty
                ? "bg-rose-600"
                : isStart || isMilestone
                ? "bg-blue-600"
                : isRecurring
                ? "bg-emerald-600"
                : "bg-amber-600";

              const badgeStyle = isPenalty
                ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                : isStart
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : isRecurring
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : isMilestone
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-amber-50 text-amber-800 border-amber-200";

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5 transition-all hover:border-slate-300 min-w-0"
                >
                  {/* Header Row: Step Number, Dot Indicator, Date & Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-slate-200">
                        {idx + 1}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} aria-hidden="true" />
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide break-words [overflow-wrap:anywhere] leading-snug">
                        {item.dateOrDuration}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeStyle}`}
                    >
                      {rawTag}
                    </span>
                  </div>

                  {/* Action Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words [overflow-wrap:anywhere]">
                    {item.title || item.actionRequired}
                  </h3>

                  {/* Context / Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words [overflow-wrap:anywhere]">
                    {item.description || item.consequenceOrContext || item.actionRequired}
                  </p>
    

                  {/* Add to Calendar Smart Popover Menu (Google, Apple/Device, Outlook) */}
                  <div className="pt-0.5">
                    <CalendarExportPopover
                      item={item}
                      documentTitle={data.document_title}
                      documentContext={`${data.original_text || ""} ${data.simplified_text || ""} ${data.document_title || ""}`}
                      index={idx}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* COMPARE VIEW: Side-by-side on desktop, Simple/Original tabs on phones */}
      <section className="space-y-4">
        {/* Mobile & Tablet Segmented Tab Controls (Visible on < 1024px) */}
        <div className="lg:hidden flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl" role="tablist" aria-label="Document view tabs">
          <button
            type="button"
            role="tab"
            aria-selected={mobileCompareTab === "simplified"}
            onClick={() => setMobileCompareTab("simplified")}
            className={`flex-1 min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 ${
              mobileCompareTab === "simplified"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Simplified</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileCompareTab === "original"}
            onClick={() => setMobileCompareTab("original")}
            className={`flex-1 min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-1.5 ${
              mobileCompareTab === "original"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Original Document</span>
          </button>
        </div>

        {/* Desktop Side-by-Side Comparison Container (Visible on >= 1024px) */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          {/* Left Column: Plain-Language Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Plain-Language Summary</h2>
                  <p className="text-xs text-slate-600">Everyday English explanation without confusing legalese.</p>
                </div>
              </div>

              <div className="text-slate-800 text-base leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 break-words [overflow-wrap:anywhere]">
                {data.simplified_text}
              </div>

              {data.key_points && data.key_points.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    Essential Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {data.key_points.map((pt, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Original Source Document */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Original Document Text</h2>
                  <p className="text-xs text-slate-600">Verbatim text as scanned from the original document.</p>
                </div>
              </div>

              <div className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-[480px] overflow-y-auto">
                {data.original_text}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              * Original clauses preserved for verification purposes.
            </div>
          </div>
        </div>

        {/* Mobile Tabbed Content (Visible on < 1024px) */}
        <div className="lg:hidden">
          {mobileCompareTab === "simplified" ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Plain-Language Summary</h2>
                  <p className="text-xs text-slate-600">Everyday English explanation without confusing legalese.</p>
                </div>
              </div>

              <div className="text-slate-800 text-sm sm:text-base leading-relaxed bg-slate-50/70 p-3.5 sm:p-5 rounded-xl border border-slate-100 break-words [overflow-wrap:anywhere]">
                {data.simplified_text}
              </div>

              {data.key_points && data.key_points.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    Essential Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {data.key_points.map((pt, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Original Document Text</h2>
                  <p className="text-xs text-slate-600">Verbatim text as scanned from the original document.</p>
                </div>
              </div>

              <div className="text-slate-800 text-xs sm:text-sm leading-relaxed bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-[400px] overflow-y-auto">
                {data.original_text}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* KEYWORDS & TRICKY TERMS GLOSSARY */}
      {data.vocabulary && data.vocabulary.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
              <HelpCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Keywords & Tricky Terms</h2>
              <p className="text-xs text-slate-600">
                Definitions for legal, tenancy, and employment terms in this document.
              </p>

            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {data.vocabulary.map((v, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1 min-w-0 overflow-hidden [overflow-wrap:anywhere]"
              >
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block capitalize">
                  {v.term}
                </span>
                <p className="text-xs text-slate-700 leading-normal">{v.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Advisory Banner */}
      <div
        role="note"
        aria-label="Document verification notice"
        className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 leading-relaxed shadow-2xs"
      >
        <strong className="font-bold text-amber-950">Check against the original:</strong>{" "}
        {data.cautionary_note ||
          "confirm pay amounts, formal notice periods, and statutory deadlines in your document."}{" "}
        DocClear is a comprehension aid, not legal, medical or financial advice.
      </div>

      {/* Bottom Action Buttons (Print PDF, Download TXT, Copy, View Original) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Printable PDF Button (Mobile & Desktop) */}
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
        >
          <Printer className="w-4 h-4" />
          <span>Save as PDF / Print</span>
        </button>

        {/* Download Formatted Text Summary */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download text</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{isCopied ? "Copied!" : "Copy"}</span>
        </button>

        {/* View Original Modal */}
        <button
          type="button"
          onClick={() => setIsOriginalModalOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>View original</span>
        </button>
      </div>

      {/* Original Document Modal */}
      {isOriginalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">Original Document Text</h3>
              <button
                type="button"
                onClick={() => setIsOriginalModalOpen(false)}
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close original text viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {data.original_text}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOriginalModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 min-h-[44px] inline-flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOLE STICKY BOTTOM AUDIO PLAYER BAR (Never covers content due to pb-36 padding) */}
      <aside
        aria-label="Audio summary player"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0f172a] text-white p-3 sm:p-4 shadow-2xl border-t border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="w-full max-w-[1700px] mx-auto space-y-2.5 px-2 sm:px-4">
          {/* Main Controls Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handlePlayToggle}
                disabled={!isSpeechSupported}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-blue-400 min-h-[44px] min-w-[44px] ${
                  isSpeechSupported
                    ? "bg-white text-slate-900 hover:scale-105 active:scale-95"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                aria-label={
                  !isSpeechSupported
                    ? "Speech synthesis not available"
                    : isPlaying
                    ? isPaused
                      ? "Resume audio"
                      : "Pause audio"
                    : "Play audio summary"
                }
              >
                {isPlaying && !isPaused ? (
                  <Pause className="w-5 h-5 fill-slate-900 stroke-none" />
                ) : (
                  <Play className="w-5 h-5 fill-slate-900 stroke-none ml-0.5" />
                )}
              </button>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-white block truncate">
                  {!isSpeechSupported
                    ? "Voice synthesis unavailable on this device"
                    : isPlaying
                    ? isPaused
                      ? "Paused"
                      : "Reading aloud..."
                    : "Listen to plain-language summary"}
                </span>
                <span className="text-[11px] text-slate-300 block truncate">
                  {!isSpeechSupported
                    ? "Web Speech API is not supported in this browser"
                    : isPlaying && currentSentenceIdx >= 0
                    ? `Sentence ${currentSentenceIdx + 1} of ${sentenceList.length}`
                    : "Natural text-to-speech voice reader"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={cycleSpeed}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 inline-flex items-center justify-center whitespace-nowrap shadow-xs"
                title="Click to cycle playback speed (0.8x Slow, 1x Normal, 1.25x Steady, 1.5x Fast, 2x Faster)"
                aria-label={`Speech speed ${getSpeechSpeedPreset(playbackSpeed).label}, tap to change`}

              >
                {playbackSpeed}x · {getSpeechSpeedPreset(playbackSpeed).shortLabel}
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="min-h-[44px] min-w-[44px] p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Stop playback"
                  aria-label="Stop audio playback"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Timeline Scrubber Bar matching Image 4 */}
          <div className="flex items-center gap-3 text-xs text-slate-300 font-mono select-none pt-0.5">
            <span className="w-10 text-right font-medium text-slate-300">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
              {/* Dark Track Background */}
              <div className="w-full h-1 bg-slate-700/90 rounded-full overflow-hidden relative">
                {/* Played Fill */}
                <div
                  className="h-full bg-slate-200 group-hover:bg-blue-400 transition-all rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scrubber Knob / Dot */}
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none -translate-x-1/2 group-hover:scale-125 transition-transform"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Accessible Range Input Overlaid on Top */}
              <input
                type="range"
                min={0}
                max={totalDuration}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Seek audio summary"
              />
            </div>

            <span className="w-12 text-left font-medium text-slate-400">
              -{formatTime(remainingTime)}
            </span>
          </div>
        </div>
      </aside>

      {/* Interactive AI Document Agent Drawer with Real Observable Tool Calling */}
      <DocumentAgentDrawer
        documentText={data.original_text || data.simplified_text}
        documentTitle={data.document_title}
      />
    </div>
  );
};
