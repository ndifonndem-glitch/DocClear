# DocClear System Architecture & Network Security Document

**Course:** IT8530 Advanced Mobile Application Solutions  
**Architecture Style:** Layered Mobile Web Architecture (PWA + BFF Pattern)

## 1. System Layers

```
Layer 1 (Client Application):
  Next.js 14+ (App Router) + React + TypeScript + Tailwind CSS
  - Camera & File Picker (<input type="file" capture="environment">)
  - Client-Side OCR Engine (Tesseract.js WebAssembly / Web Worker)
  - Text Review & Verification Editor (FR-05)
  - Comparison Engine (Side-by-Side & Tabbed Modes)
  - Web Speech API Controller (window.speechSynthesis)
  - Interactive HCI Evaluation Center (/evaluate)

Layer 2 (Backend-for-Frontend - BFF Tier):
  Next.js Server-Side Route Handlers (/app/api/analyse/route.ts)
  - Input sanitation and validation
  - Readability grade computation (Flesch-Kincaid)
  - High-fidelity mock engine for Assessment 2
  - Safe proxy connector to EduStack Lite / OpenClaw for Assessment 3

Layer 3 (Enterprise Orchestration Layer):
  EduStack Lite / OpenClaw Gateway (:18789)
  - Inference Shim (:8000)
  - Language Model (Ollama local / Cloud LLM)
```

## 2. Privacy & Security Safeguards

1. **Client-Side Document OCR:** Document image pixels are decoded and recognized directly within the browser using WebAssembly. No image binaries are transmitted across unencrypted networks.
2. **No Storage of PII:** Extracted document text is held in ephemeral browser memory (`sessionStorage`) and can be purged instantly via the "Clear Document" action (FR-15).
3. **Server-Side Secret Isolation:** Any future API keys or orchestration tokens (`OPENCLAW_TOKEN`) remain exclusively on the server side in `.env` variables and are never bundled into client-side JavaScript.
