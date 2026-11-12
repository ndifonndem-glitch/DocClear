"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  X,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  parseEventDateTime,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
  CalendarEventPayload,
} from "@/lib/calendar";
import { ExtractedDeadline } from "@/types/api";

export interface CalendarExportPopoverProps {
  item: ExtractedDeadline;
  documentTitle?: string;
  documentContext?: string;
  index: number;
}

export const CalendarExportPopover: React.FC<CalendarExportPopoverProps> = ({
  item,
  documentTitle = "Document",
  documentContext = "",
  index,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const eventTitle = item.title || item.actionRequired || "Scheduled Document Obligation";
  const rawTiming = item.dateOrDuration || "";
  const description = `${item.description || item.consequenceOrContext || ""}\n\nDocument: ${documentTitle}\nReference: DocClear Plain-Language Summary`.trim();

  // Smart parsed date
  const { startDate, endDate, allDay, hasExplicitDate } = parseEventDateTime(rawTiming, documentContext);

  const payload: CalendarEventPayload = {
    title: eventTitle,
    description,
    startDate,
    endDate,
    allDay,
    location: documentTitle,
  };

  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(payload);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    const url = getOutlookCalendarUrl(payload);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleDeviceCalendar = () => {
    const safeFileName = `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.ics`;
    downloadIcsFile(payload, safeFileName);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      setIsOpen(false);
    }, 1800);
  };

  // Formatted date preview for user verification
  const formattedDate = startDate.toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = allDay
    ? "All-day reminder"
    : startDate.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button (Min 44x44px touch target) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] px-3 py-2 rounded-xl transition-colors"
        aria-label={`Add to calendar: ${eventTitle}`}
      >
        <CalendarIcon className="w-4 h-4 text-blue-700 flex-shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">Add to calendar</span>
      </button>

      {/* Responsive Portal Modal (Bottom Sheet on Phone, Centered Dialog on Desktop) */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
                buttonRef.current?.focus();
              }
            }}
          >
            <div
              ref={popoverRef}
              role="dialog"
              aria-modal="true"
              aria-label="Add to calendar options"
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 space-y-3.5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
            >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900">Add to Calendar</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-11 h-11 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close calendar options"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Event Preview Pill */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1 min-w-0">
            <span className="text-xs font-bold text-slate-900 block break-words [overflow-wrap:anywhere] leading-snug">
              {eventTitle}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {formattedDate} • {formattedTime}
              </span>
            </div>
            {rawTiming && (
              <span className="text-[10px] text-slate-500 block">
                Original text: &quot;{rawTiming}&quot;
              </span>
            )}
            {!hasExplicitDate && (
              <span className="text-[10px] text-amber-800 block font-medium">
                No specific calendar date in clause — defaulted to today; adjust date in your calendar app if needed.
              </span>
            )}
          </div>

          {/* Calendar Options (Min 44x44px touch targets) */}
          <div className="space-y-2">
            {/* 1. Google Calendar Button */}
            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-800 font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[46px] group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  G
                </span>
                <span>Google Calendar</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            {/* 2. Apple / Device Native Calendar (.ics) */}
            <button
              type="button"
              onClick={handleDeviceCalendar}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-800 font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[46px] group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </span>
                <div className="text-left">
                  <span>Apple / Device Calendar</span>
                  <span className="text-[10px] text-slate-500 block font-normal">
                    .ics file — no Google or Outlook login needed
                  </span>
                </div>
              </div>

              {downloadSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
              ) : (
                <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              )}
            </button>

            {/* 3. Outlook / Office 365 Web Calendar */}
            <button
              type="button"
              onClick={handleOutlookCalendar}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-slate-800 font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[46px] group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#0078D4] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  O
                </span>
                <span>Outlook Calendar</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>
          </div>

          {/* Privacy Note */}
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Zero login required • Formatted client-side with 100% privacy</span>
          </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
