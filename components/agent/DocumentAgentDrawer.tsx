"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { AgentChatResponse, AgentToolTraceItem } from "@/app/api/agent/chat/route";

export interface DocumentAgentDrawerProps {
  documentText: string;
  documentTitle?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  citations?: string[];
  grounded?: boolean;
  toolTrace?: AgentToolTraceItem[];
  timestamp: string;
}

const DEMO_QUESTIONS = [
  {
    label: "💰 Monthly Salary & Pay Date",
    query: "What is my gross monthly salary and when is it paid?",
  },
  {
    label: "🏖️ Emergency Leave Rules",
    query: "What if I need to take emergency leave?",
  },
  {
    label: "📅 Deadlines & Penalties",
    query: "What are the payment deadlines, and what happens if I pay late?",
  },
  {
    label: "🐾 Pets Policy (Check Missing Clause)",
    query: "What is the policy for keeping pets in this property?",
  },
];

export const DocumentAgentDrawer: React.FC<DocumentAgentDrawerProps> = ({
  documentText,
  documentTitle = "Document",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message or thinking state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
          documentTitle,
          question: text,
        }),
      });

      const data: AgentChatResponse = await res.json();

      const agentMessageId = `msg_agent_${Date.now()}`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        sender: "agent",
        text: data.answer || "I could not find information on this question in the document.",
        citations: data.citations || [],
        grounded: data.grounded,
        toolTrace: data.toolTrace || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch {
      const errMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: "agent",
        text: "I encountered a connection issue. Please check your network and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Rounded Circular Action Button on /comparison (Cleanly aligned above the bottom audio bar) */}
      <div className="fixed bottom-[118px] sm:bottom-[110px] right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Ask Document Agent"
          aria-label="Open AI Document Assistant chat"
          className="relative group w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border border-blue-300/40 focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          {/* Animated Soft Glow Ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-50 blur-md group-hover:opacity-90 animate-pulse transition-opacity pointer-events-none" />

          {/* Active Online Status Badge */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900" />
          </span>

          {/* Agent Icon */}
          <Bot className="relative z-10 w-6 h-6 stroke-[2.2] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300" />
        </button>
      </div>

      {/* Slide-over / Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-drawer-title"
            className="w-full sm:max-w-xl bg-slate-950 text-slate-100 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-[85vh] sm:h-[680px] max-h-[92vh] overflow-hidden transition-all animate-in slide-in-from-bottom duration-300"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="agent-drawer-title" className="font-extrabold text-sm sm:text-base text-white">
                      DocClear AI Agent
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                    Reasoning over {documentTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Close Document Agent drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
              {/* Introduction Greeting */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Ask anything about this document</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Ask questions about your salary, emergency leave, notice deadlines, or contract terms. You will receive an accurate, plain-language answer verified directly from the document.
                </p>

                {/* Pre-seeded Suggested Question Chips */}
                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Suggested Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMO_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q.query)}
                        className={`text-[11px] text-left px-3 py-2 min-h-[44px] inline-flex items-center rounded-xl border transition-all font-semibold shadow-2xs ${
                          q.label.includes("Missing")
                            ? "bg-amber-950/40 border-amber-800 text-amber-200 hover:bg-amber-900/50"
                            : "bg-slate-800 border-slate-700 text-blue-300 hover:bg-slate-700 hover:border-blue-500/50"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message History */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Citations Pills */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Sources:
                        </span>
                        {msg.citations.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-blue-200 border border-slate-700"
                          >
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Observable Tool Trace Pills */}
                    {msg.toolTrace && msg.toolTrace.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Tool Execution Trace ({msg.toolTrace.length} steps)
                        </span>
                        <div className="space-y-1">
                          {msg.toolTrace.map((t) => (
                            <div
                              key={t.step}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span
                                  className={`font-mono font-bold mr-1.5 ${
                                    t.status === "success" ? "text-emerald-400" : "text-amber-400"
                                  }`}
                                >
                                  {t.step}. {t.tool}()
                                </span>
                                <span className="text-slate-400 break-words">{t.output}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {t.durationMs}ms
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clean Grounding Status Pill */}
                    {msg.sender === "agent" && msg.grounded !== undefined && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          {msg.grounded ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified from Document</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Not Mentioned in Document</span>
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* CLEAN SIMPLE LOADING STATE: ONLY AGENT ICON + SUBTLE BOUNCING DOTS (NO HEAVY TEXT/ANIMATIONS) */}
              {isLoading && (
                <div className="flex flex-col items-start space-y-1 animate-in fade-in duration-200 my-1">
                  <div className="p-3 px-4 rounded-2xl rounded-bl-xs bg-slate-900 text-slate-100 border border-slate-800 shadow-xs flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center animate-pulse shadow-xs">
                      <Bot className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="flex items-center gap-1.5 px-0.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Question Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <Sparkles className="absolute left-3.5 w-4 h-4 text-blue-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about salary, emergency leave, rules..."
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white placeholder-slate-400 rounded-xl text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] min-w-[44px]"
                aria-label="Send question to Document Agent"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
