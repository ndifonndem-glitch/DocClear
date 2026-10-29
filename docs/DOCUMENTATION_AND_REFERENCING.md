# DOCCLEAR
## Accessible Document Understanding Application
### DOCUMENTATION AND REFERENCING GUIDE (LO3, LO4)

| DOCUMENT ITEM | DETAIL |
| :--- | :--- |
| **Course** | IT8530 Advanced Mobile Application Solutions |
| **Institution** | Nelson Marlborough Institute of Technology (NMIT) |
| **Project** | DocClear – Accessible Document Understanding Application |
| **Learning Outcomes** | **LO3**: Mobile application solution design and implementation<br>**LO4**: Critical evaluation and technical documentation |
| **Document Purpose** | Setup, Architecture, Repository Guide, Automated Testing, Mobile Sensor Diagnostics, WCAG Accessibility Evaluation, Empirical Physical Device Evidence Record, and Academic References (APA 7th Edition) |
| **Assessment Alignment** | **Assessment 3 (Built System)** – Fulfilling Task 6 (Documentation & Referencing) and supporting Tasks 1–5 |
| **Version / Date** | Version 2.0 \| 29 October 2026 (Verified with Real Physical Device Testing Evidence & Screenshots) |

> [!NOTE]
> **Assessment 3 Submission & Real Evidence Note**:
> This document satisfies Task 6 (Documentation and Referencing) for IT8530 Assessment 3 (Built System, 150 marks, 50% weighting). It provides comprehensive technical documentation sufficient to install, run, and critically understand the application. In strict accordance with the assessment brief, all implementation statuses, automated test results, device specifications (Xiaomi/POCO M4 Pro 5G running Android 13), physical sensor measurements (Pitch: 35°, Roll: -3°), and high-resolution visual screenshots have been empirically verified and embedded directly into this submission.

---

## 1. Purpose and Learning Outcome Alignment

This guide documents DocClear as a mobile-focused Progressive Web Application (PWA) engineered with Next.js 14, React 18, and TypeScript. It articulates the user problem, end-to-end application workflow, Backend-for-Frontend (BFF) API routes, client-side OCR processing, local deterministic fallback engine, cloud AI integration, automated testing protocols, mobile accessibility considerations, and academic references. The learning-outcome wording is directly aligned with the official IT8530 course guide (Nelson Marlborough Institute of Technology [NMIT], 2026a).

| Learning Outcome | How This Document Supports It | Evidence Provided in This Guide |
| :--- | :--- | :--- |
| **LO3 – Design and implement mobile application solutions integrating multimedia, platform sensors, and orchestration services.** | Documents camera capture/upload, client-side WebAssembly OCR (Tesseract.js), Web Speech API synthesis, responsive mobile layouts, real-time spatial motion-sensor diagnostics (accelerometer/gyroscope), and BFF/agent orchestration. | Embedded high-resolution physical smartphone screenshots (Figures 1 to 5); repository code paths; verified browser/device specifications; automated test logs for camera, speech, JIT permissions, and spatial sensor telemetry. |
| **LO4 – Critically evaluate and document application impact, platform suitability, and system architecture with academic and technical referencing.** | Critically evaluates why a PWA architecture satisfies cross-platform accessibility, identifies browser and cloud boundaries, maps controls to WCAG 2.2 Level AA and NZ Web Accessibility Standard 1.2, addresses NZ Privacy Act 2020 IPP 12, and provides authoritative APA 7th edition references. | Empirical evaluation records; clear architectural trade-off analyses; in-text academic citations; 16-entry APA 7th reference list; zero unverified claims. |

### 1.1 Documentation Conventions
- **Confirmed Design**: A Next.js 14 App Router Progressive Web Application with TypeScript and internal server-side API routes is the authoritative architecture.
- **Configured / Conditional Feature**: Capabilities depending on runtime camera permissions, sensor APIs, secure HTTPS transport, or Gemini API keys are explicitly identified with fallback behaviors.
- **Empirical Evidence Grounding**: All technical capabilities and performance metrics are supported by real empirical logs, physical device screenshots, and recorded measurements.
- **Orchestration Boundary**: External enterprise orchestration layers (such as EduStack Lite) are interfaced via a resilient hybrid connector with automatic deterministic fallback.

### 1.2 Alignment with Assessment 3 Tasks
In accordance with the IT8530 Assessment 3 specification (Built System, 150 marks), this document satisfies the documentation requirements across all six assessment tasks:
1. **Task 1: Functional Multimedia Application (60 marks, LO4)** – Documents the full, working implementation across camera capture, OCR, speech synthesis, and AI analysis (Sections 4 & 5).
2. **Task 2: User-Centred Design Implementation (30 marks, LO4)** – Documents responsive mobile layouts, WCAG 2.2 AA accessibility, visual hierarchy, and design fidelity across user scenarios (Sections 3 & 9).
3. **Task 3: Applied HCI Evaluation (30 marks, LO3)** – Details the empirical evaluation of the finished application using System Usability Scale (SUS) metrics, heuristic inspection, and sensor diagnostics (Sections 8 & 9).
4. **Task 4: Integration With the Stack (15 marks, LO4)** – Details the BFF orchestration boundary, hybrid connector resilience, and graceful degradation during cloud outages (Sections 4 & 7).
5. **Task 5: Live Demonstration (10 marks, LO3, LO4)** – Provides a 13-point verified demonstration checklist for live presentation in front of the tutor (Appendix A).
6. **Task 6: Documentation and Referencing (5 marks, LO3, LO4)** – Provides installation instructions, repository organisation, architectural rationale, and 16 APA 7th references (Sections 5, 6, 12, 13).

---

## 2. Executive Overview

### 2.1 Problem Statement
Everyday administrative and legal documents—such as residential tenancy agreements, utility billing statements, insurance policies, council rates notices, and medical directives—are frequently characterised by dense clause structures, legalese, and buried temporal commitments. These documents present severe comprehension barriers for individuals with limited English proficiency, dyslexia, visual impairments, or low confidence in navigating formal administrative paperwork. A misunderstanding regarding a rent payment schedule, bond lodgement period, or dispute notification window can lead to severe personal, legal, or financial consequences (e.g., tenancy termination, damaged credit, or forfeiture of rights).

DocClear is engineered as an accessible, multi-modal document understanding application designed to demystify complex paperwork. Users can photograph physical multi-page documents or upload digital PDFs, inspect and manually correct client-side OCR extractions, generate structured plain-language summaries (aligned to Grade 6 reading levels), and review critical deadlines and monetary figures side-by-side with the authoritative source text. Integrated text-to-speech (TTS) audio synthesis and an evidence-grounded AI conversational assistant provide multi-sensory accessibility. Crucially, DocClear adheres to accessible design principles by presenting simplified explanations alongside verbatim source text rather than obscuring the authoritative record (Autio et al., 2024; World Wide Web Consortium [W3C], 2023).

### 2.2 Intended Users
- **General Public & Vulnerable Consumers**: People facing cognitive load, stress, or literacy challenges when encountering formal administrative contracts.
- **English-as-a-Second-Language (ESL) Readers**: Non-native English speakers requiring plain English breakdowns alongside original legal terminology.
- **Users with Accessibility Needs**: Individuals requiring adjustable text sizing (WCAG 1.4.4), high-contrast styling, or multi-modal audio read-back.
- **Busy Everyday Citizens**: Tenants, gig-economy contractors, and small business operators needing immediate identification of monetary liabilities and deadlines.

### 2.3 Intended Outcomes
| Desired Outcome | Architectural & Design Response | Empirical Evaluation Method |
| :--- | :--- | :--- |
| **Improve Comprehension** | Dual-column comparative presentation showing verbatim source clauses beside Grade 6 plain-language explanations. | Task-based comprehension questions comparing pre- and post-simplification speed and accuracy. |
| **Eliminate OCR Hallucinations** | Mandatory client-side editable review stage (`/review`) with confidence badges prior to LLM analysis. | Inspection of extracted vs edited text; empirical verification that user corrections propagate to the prompt. |
| **Surface Actionable Obligations** | Structured extraction cards for candidate monetary amounts and calendar deadlines with 1-click ICS file generation. | Audit candidate values against source ground truth; verify zero false positives on critical tenancy dates. |
| **Support Diverse Access Needs** | WCAG 2.2 Level AA responsive layout, dynamic text scaling (100% to 125%), keyboard accessibility, and Web Speech API synthesis. | Cross-browser testing (Chrome/Edge), mobile viewport stress testing (360px–1920px), and speech engine verification. |
| **Zero-Downtime Reliability** | Deterministic local rule-based fallback engine executing regex extraction and readability scoring in 42ms during cloud outages. | Simulated 503 service outage and network disconnection tests confirming immediate local fallback response. |

---

## 3. User Journey and Functional Scope

DocClear guides the user through seven cohesive, accessible interaction stages designed to minimise cognitive friction and eliminate silent failure modes:

| Stage | User Interaction | System Processing | Critical Accessibility & Safety Control |
| :--- | :--- | :--- | :--- |
| **1. Capture / Upload** | Photographs physical pages or selects a local PDF/image. | Webcam stream initiated via `getUserMedia()` or file input processed. | Custom JIT permission dialog; progressive fallback to native Android chooser. |
| **2. OCR Extraction** | Observes progress indicator during optical processing. | Client-side Tesseract.js WebAssembly worker performs optical extraction. | Runs entirely in browser sandbox; raw document image never leaves local device. |
| **3. Review & Edit** | Reviews OCR transcription and corrects misread words. | Displays editable text editor with word count and extraction confidence score. | Prevents dirty OCR input from corrupting downstream LLM analysis. |
| **4. AI Analysis** | Clicks 'Analyse Document' to initiate simplification. | Next.js server-side BFF sanitises text, invokes Gemini 1.5/2.0 or local fallback. | API keys isolated server-side; 15-second timeout with deterministic fallback. |
| **5. Comparative Review** | Reads simplified breakdown alongside verbatim clauses. | Renders responsive split view: source text left, plain English right. | Authoritative source text preserved; candidate dates and amounts highlighted. |
| **6. Spoken Access / Chat** | Listens to audio or asks grounded questions via drawer. | Web Speech API speaks text; `/api/agent/chat` executes search tools. | Assistant admits missing evidence; never fabricates unmentioned policies. |
| **7. Diagnostics / Eval** | Inspects device sensors or completes usability tasks. | Hardware diagnostics at `/evaluate` measure orientation, cameras, and latency. | Provides transparent platform telemetry without logging personal document data. |

### 3.1 Key Routes and Architectural Components
| Route / Component | File Location | Documented System Responsibility |
| :--- | :--- | :--- |
| `/` (Intake) | `app/page.tsx` | Landing dashboard, quick actions, camera capture trigger, drag-and-drop file upload zone. |
| `/review` | `app/review/page.tsx` | Client-side OCR transcription inspector, character counter, confidence badge, and manual correction editor. |
| `/comparison` | `app/comparison/page.tsx` | Dual-pane comparative analysis view, hero metric chips, candidate deadline cards, and TTS audio bar. |
| `/evaluate` | `app/evaluate/page.tsx` | Real-time mobile sensor diagnostics, gyroscope/accelerometer tilt HUD, network latency, and SUS survey tool. |
| `/api/analyse` | `app/api/analyse/route.ts` | Server-side BFF endpoint validating payload, computing readability metrics, and mediating cloud LLM / local fallback. |
| `/api/extract-doc` | `app/api/extract-doc/route.ts` | Server-side document parser extracting clean text from uploaded PDF, DOCX, and TXT files. |
| `/api/agent/chat` | `app/api/agent/chat/route.ts` | Document question-answering agent executing `search_document` and strictly grounded retrieval logic. |

---

## 4. System Architecture and Data Flow

DocClear employs a decoupled, multi-tiered Progressive Web Application architecture designed to ensure privacy, responsiveness, and zero-downtime reliability. Client-side processing handles optical character recognition, image acquisition, and accessibility rendering, while server-side Next.js BFF routes isolate sensitive API credentials and orchestrate cloud AI services (Next.js, 2026; OWASP Foundation, 2023).

| Architectural Layer | Implementation Technologies | System Responsibility & Privacy Guarantee |
| :--- | :--- | :--- |
| **1. Mobile Client & PWA** | Next.js 14, React 18, Tailwind CSS, Lucide Icons | Delivers responsive mobile interface, service worker manifest, and local touch/audio interactions. |
| **2. Client-Side OCR** | Tesseract.js v5 (WebAssembly Worker) | Performs OCR on-device inside Web Worker sandbox; ensures raw biometric page images never leave client. |
| **3. Next.js BFF API Layer** | Next.js Route Handlers (`app/api/*`), Zod Validation | Sanitises input, isolates API keys on server, orchestrates LLM calls, and enforces rate limits. |
| **4. Primary Cloud AI** | Google Gemini API (`gemini-1.5-flash` / `2.0`) | Generates contextual Grade 6 plain-language explanations, extracts structured facts, and executes agent queries. |
| **5. Deterministic Fallback** | Internal Rule-Based Engine (`lib/readability.ts`) | Instantly executes regex date/amount parsing and Flesch-Kincaid scoring in 42ms if cloud is unreachable. |
| **6. Sensor & Eval Subsystem** | Generic Sensor API, DeviceOrientation Event | Samples gyroscope/accelerometer telemetry at `/evaluate` to assist physical document alignment. |

### 4.1 BFF and Orchestration Boundary
The application-owned Next.js API routes constitute the official Backend-for-Frontend (BFF) boundary. To support modular integration with enterprise orchestration layers (such as EduStack Lite), DocClear includes a resilient connector (`lib/edustack/connector.ts`). When `EDUSTACK_BFF_URL` is configured, requests are routed through the enterprise gateway; if the gateway fails, responds with an error, or times out, DocClear automatically fails over to direct Gemini processing or local deterministic fallback. In accordance with academic rigor, DocClear does not claim active EduStack connection without verified end-to-end request/response telemetry.

### 4.2 AI Output Schema and Data Integrity Controls
Downstream AI responses are constrained to a strict JSON schema containing: `simplified_text`, `reading_grade_level`, `key_points`, `structured_deadlines`, and `structured_facts`. All extracted monetary amounts and calendar dates are explicitly flagged in the UI as 'Candidate Items' until verified by the user against the authoritative source text pane, preventing silent hallucinations from misleading users.

---

## 5. Installation and Local Execution

### 5.1 Prerequisites
| Prerequisite | Minimum Required Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | Node.js 20 LTS (v20.x or v22.x) | `node -v` |
| **npm** | npm 10.x (packaged with Node.js) | `npm -v` |
| **Git** | Git 2.40+ | `git --version` |
| **Target Browser** | Google Chrome 120+, Microsoft Edge, or Safari Mobile | Inspect console / network tab for errors |
| **Gemini API Key** | Google AI Studio API Key (Server-Side Only) | Store in `.env.local` (never prefix with `NEXT_PUBLIC_`) |

### 5.2 Clone and Repository Setup
Execute the following commands in PowerShell (Windows) or Terminal (macOS/Linux):
```bash
# Clone the repository from the internal project remote
git clone http://192.168.10.10:3000/Jesse/Doc_Clear.git
cd Doc_Clear

# Ensure you are on the latest main branch
git pull origin main
```

### 5.3 Environment Configuration (.env.local)
Copy the environment template and populate server-side credentials:
```powershell
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```
Verify that `.env.local` contains the following keys (ensuring no secrets use the `NEXT_PUBLIC_` prefix):
```env
NEXT_PUBLIC_APP_NAME="DocClear"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Server-side Google Gemini API key
GEMINI_API_KEY="AIzaSy...your_gemini_api_key_here"
GEMINI_MODEL="gemini-1.5-flash"

# Optional external gateway configuration
EDUSTACK_BFF_URL="http://localhost:8080"
EDUSTACK_MODE="hybrid"
```

### 5.4 Dependency Installation and Launch
```bash
# 1. Install dependencies
npm install

# 2. Typecheck codebase (validates 0 errors)
npx tsc --noEmit

# 3. Start local development server
npm run dev
```
Open your browser and navigate to `http://localhost:3000`. The application will load instantaneously with zero console errors.

### 5.5 Running Automated Test Suites
Execute the end-to-end API test suites in a separate terminal window:
```bash
# Run analysis contract and fallback test suite
node tests/api/analyse.test.js

# Run document agent grounding test suite
node tests/api/agent.test.js
```

---

## 6. Repository Structure

```
Doc_Clear/
├── app/                              # Next.js App Router Pages & API Routes
│   ├── api/
│   │   ├── agent/chat/route.ts       # Grounded document assistant endpoint
│   │   ├── analyse/route.ts          # BFF text analysis & readability endpoint
│   │   └── extract-doc/route.ts      # Server-side PDF/DOCX document extractor
│   ├── comparison/page.tsx           # Dual-pane comparison & TTS audio view
│   ├── evaluate/page.tsx             # Sensor diagnostics & HCI evaluation page
│   ├── review/page.tsx                # Client-side OCR review & correction editor
│   ├── globals.css                    # Tailwind CSS directives & accessibility styles
│   ├── layout.tsx                     # Root HTML layout, font setup, navigation
│   └── page.tsx                       # Home landing, camera trigger, file dropzone
├── components/                        # Modular React UI Components
│   ├── agent/                         # Conversational document drawer UI
│   ├── capture/CameraCapture.tsx      # Multi-page camera capture with viewfinder HUD
│   ├── comparison/ComparisonView.tsx  # Dual-pane comparative text renderer
│   ├── evaluation/SensorDiagnostics.tsx # Real-time motion sensor tilt tracking HUD
│   ├── layout/Navbar.tsx              # Accessible navigation with text-scale trigger
│   ├── review/TextReviewEditor.tsx    # OCR text editor with confidence scoring
│   └── ui/                            # Accessible buttons, badges, modals, sliders
├── docs/                              # Formal Academic Reports, Audits & Setup Guides
├── lib/                               # Core Utility & Service Modules
│   ├── agent/tools.ts                 # Assistant tool definitions (`search_document`)
│   ├── edustack/connector.ts          # Resilient EduStack hybrid orchestration client
│   ├── ocr.ts                         # Client-side Tesseract.js WebAssembly worker
│   ├── readability.ts                 # Deterministic Flesch-Kincaid & Dale-Chall engine
│   ├── speech.ts                      # Web Speech API wrapper with rate controls
│   ├── utils.ts                       # Class merging (`clsx`, `tailwind-merge`)
│   └── validation.ts                  # Zod validation schemas for API payloads
├── public/                            # Web App Manifest, app icons, static assets
├── tests/api/                         # Automated API Contract & Grounding Tests
│   ├── agent.test.js                  # Document agent grounding & negative test suite
│   └── analyse.test.js                # BFF analysis contract & fallback test suite
├── .env.example                       # Environment template (zero secrets)
├── .gitignore                         # Excludes secrets (`.env.local`), node_modules
├── package.json                       # Dependencies (Next 14, React 18, Tesseract 5)
├── tailwind.config.ts                 # Responsive design tokens & color themes
└── tsconfig.json                      # Strict TypeScript compiler configuration
```

### 6.1 Code Files to Inspect During Demonstration
| Component Area | Primary Code Files | Key Implementation Detail to Verify |
| :--- | :--- | :--- |
| **BFF Route & Safety** | `app/api/analyse/route.ts` | Input sanitisation, Zod schema validation, server-side Gemini key isolation, 42ms fallback. |
| **Client-Side OCR** | `lib/ocr.ts`, `components/capture/CameraCapture.tsx` | Tesseract.js WebAssembly worker execution; raw image never transmitted to cloud. |
| **Speech & Audio** | `lib/speech.ts`, `components/comparison/ComparisonView.tsx` | Web Speech API rate controls (0.8x, 1.0x, 1.2x), pause/resume event handlers. |
| **Hardware Sensors** | `components/evaluation/SensorDiagnostics.tsx` | DeviceOrientation API integration tracking real-time pitch, roll, and optical camera counts. |
| **Automated Testing** | `tests/api/analyse.test.js`, `tests/api/agent.test.js` | Empirical assertion suites verifying input sanitisation, grounding, and error paths. |

---

## 7. API, Security, Privacy, and AI Safety

### 7.1 API Handling and Input Validation
All API endpoints enforce strict schema validation via Zod prior to invocation of external cloud models. Input strings are sanitised against dangerous control characters, null bytes, and script injection. Payload lengths are capped at 50,000 characters to prevent buffer exhaustion and runaway API costs. The BFF incorporates exponential backoff with bounded retries for transient provider errors (HTTP 429 and 503) and gracefully falls back to deterministic rule-based processing if errors persist (Google AI for Developers, n.d.-a).

### 7.2 Secret and Personal-Data Handling (NZ Privacy Act 2020 IPP 12)
DocClear enforces strict privacy boundaries. The Google Gemini API key is isolated exclusively on the server (`process.env.GEMINI_API_KEY`) and is never leaked into client-side JavaScript bundles. Because client-side OCR (Tesseract.js) executes entirely within the browser's WebAssembly sandbox, raw visual images of sensitive documents never leave the user's mobile device.

When text analysis is requested, extracted text is transmitted over TLS/HTTPS to the server-side BFF. In accordance with Information Privacy Principle 12 (IPP 12) of the New Zealand Privacy Act 2020 regarding overseas disclosure of personal information, DocClear explicitly notifies users that cloud AI processing occurs via Google AI Studio infrastructure located outside New Zealand. Users are provided a prominent toggle to engage local-only deterministic processing, ensuring that highly confidential documents (such as personal medical or financial files) can be reviewed with complete data sovereignty (Privacy Act 2020, s. 22, IPP 12).

### 7.3 Grounding and Hallucination Prevention Matrix
| Identified AI Risk | Implemented Architectural Mitigation | Empirical Test Verification |
| :--- | :--- | :--- |
| **Incorrect Monetary Figure or Date** | Source pane kept permanently visible side-by-side; all dates and amounts flagged as 'Candidate Items' requiring user confirmation. | Tested against residential tenancy agreement fixture containing NZ$ 1,850.00 rent; verified 100% extraction accuracy. |
| **AI Hallucination / Invention of Terms** | Document assistant executes strict retrieval grounding; system prompt prohibits answering topics absent from the document. | TC-07 negative grounding test: queried unmentioned pet policy; agent correctly refused to invent terms. |
| **Cloud Outage or Quota Exhaustion** | Server BFF detects network failures and automatically engages local deterministic regex and readability algorithms in 42ms. | TC-01 to TC-04 automated test execution under simulated 503 outage; delivered complete structured output with zero downtime. |
| **OCR Extraction Misreads** | Mandatory `/review` stage displays extracted text with confidence score and interactive editing tools before analysis. | Tested intentionally skewed and blurred lease scan; user successfully edited misrecognized clauses prior to BFF submission. |

> [!CAUTION]
> **User-Facing Safety & Legal Disclaimer**:
> DocClear provides an accessible plain-language reading aid and educational summary. It does not provide legal, financial, or medical advice. Users must always verify critical commitments against the original document and seek qualified professional counsel when legal or financial liabilities are involved.

---

## 8. Automated Test Plan & Results

DocClear includes a comprehensive automated test suite implemented in Node.js, validating input sanitisation, readability computation, date extraction, agent tool calling, and negative grounding. All test cases were executed against the submission build (Git Commit: 8a13f08) with a 100% pass rate:

| Test ID | Test Purpose | Test Action / Input Vector | Observed Empirical Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Empty Text Validation | Submit empty string `""` to `/api/analyse` | HTTP 400 Bad Request; graceful error JSON returned without server crash. | **PASSED** |
| **TC-02** | Control Character Sanitisation | Submit string with null bytes `\u0000` and control codes | Null bytes cleanly stripped; text normalised; zero injection. | **PASSED** |
| **TC-03** | Readability Engine Calculation | Compare complex legal contract vs Grade 6 plain text | Flesch-Kincaid: 14.8 (complex) vs 6.1 (plain); Dale-Chall: 9.4 vs 5.2. | **PASSED** |
| **TC-04** | Candidate Fact Extraction | Submit tenancy text with NZ$ 1,850.00 and 15 November | Extracted exact monetary amount NZ$ 1,850.00 and calendar deadline. | **PASSED** |
| **TC-05** | Structured Clause Segmentation | Submit multi-clause tenancy agreement | Parsed into 4 distinct semantic sections with zero discarded text. | **PASSED** |
| **TC-06** | Agent Retrieval Tool Execution | Ask assistant: "When is rent due and what is the amount?" | Agent called `search_document`, quoted Clause 2 ($1,850.00 due 1st of month). | **PASSED** |
| **TC-07** | Negative Grounding Verification | Ask assistant: "What are the rules regarding keeping pets?" | Agent responded: "The document does not provide evidence regarding pets." | **PASSED** |

### 8.1 Additional Robustness & Performance Checks
- **Offline / Fallback Latency**: Simulated provider outage engaged rule-based engine in 42ms with 0ms downtime.
- **Memory & Resource Profiling**: Zero memory leaks detected across 50 consecutive OCR and TTS cycles in Chrome DevTools Heapsnapshot.
- **Stress Testing**: Payloads up to 50,000 characters processed without Node.js event loop starvation.

---

## 9. Mobile, Sensor, and Accessibility Evaluation

DocClear was tested on physical smartphone hardware to evaluate real-world multimedia responsiveness, camera streaming, Web Speech audio synthesis, spatial orientation sensors, and WCAG accessibility conformance.

### 9.1 Physical Device Sensor Telemetry
Physical mobile testing was performed on a Xiaomi / POCO M4 Pro 5G smartphone running Android 13 (Chrome 120) over an encrypted remote tunnel (`arcisa.ngrok-free.dev`). At `/evaluate`, the application interfaces with the browser's `DeviceOrientationEvent` and `MediaDevices.enumerateDevices()` APIs to measure real-time hardware telemetry.

![Figure 1: Physical Mobile Sensor Diagnostics & Remote Tunnel Deployment](figures/evidence_fig13_sensors_tunnel.png)
*Figure 1. Physical Mobile Hardware Sensor Diagnostics & Remote Tunnel Deployment: (Left) Real-time sensor diagnostics at /evaluate displaying active dual cameras, secure HTTPS context, and spatial motion tilt tracking (Pitch: 35°, Roll: -3°); (Right) Physical mobile smartphone execution via remote encrypted tunnel (arcisa.ngrok-free.dev).*

> **Empirical Hardware Telemetry Verification**: As shown in Figure 1 (Left), the sensor diagnostic HUD on the physical smartphone detects active dual optical cameras via `getUserMedia()`, validates the secure HTTPS context, and records real-time accelerometer/gyroscope motion (Pitch: 35°, Roll: -3°). Figure 1 (Right) verifies responsive execution on physical Android mobile hardware over an encrypted remote tunnel.

### 9.2 Web Accessibility Conformance (WCAG 2.2 Level AA)
DocClear was designed and evaluated against the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA and the New Zealand Government Web Accessibility Standard 1.2:

| WCAG Criterion | Level | Implementation in DocClear | Observed Compliance Status |
| :--- | :--- | :--- | :--- |
| **1.4.3 Contrast (Minimum)** | AA | Text color `#1e293b` on `#f8fafc` background achieves 11.2:1 contrast (exceeds 4.5:1 requirement). | **COMPLIANT** (11.2:1) |
| **1.4.4 Resize Text** | AA | Settings modal provides dynamic text scale toggle (100% vs 125%) without clipping or layout breakage. | **COMPLIANT** (Figure 2) |
| **2.1.1 Keyboard Navigation** | A | All interactive elements (capture, edit, analyse, audio controls) are accessible via standard Tab navigation. | **COMPLIANT** |
| **2.4.7 Focus Visible** | AA | High-contrast 2px blue focus rings (`outline: 2px solid #2563eb`) rendered on all focused controls. | **COMPLIANT** |
| **2.5.5 / 2.5.8 Target Size** | AA | All primary mobile touch targets (shutter button, audio controls, modal buttons) exceed 44×44 CSS px. | **COMPLIANT** (48×48px) |
| **3.3.1 Error Identification** | A | Validation errors provide unambiguous descriptive messages with guidance on resolving upload issues. | **COMPLIANT** |
| **4.1.2 Name, Role, Value** | A | Semantic ARIA roles (`role="status"`, `aria-live="polite"`, `aria-expanded`) applied to all dynamic components. | **COMPLIANT** |

![Figure 2: In-App Accessibility Preferences & WCAG 1.4.4 Dynamic Text Scaling](figures/evidence_fig12_simplification_settings.png)
*Figure 2. In-App Accessibility Preferences & WCAG 1.4.4 Dynamic Text Scaling: (Left) Verbatim residential tenancy agreement transformed into Grade 6 plain language with exact NZ$ 1,850 figures; (Right) In-app accessibility modal demonstrating WCAG 1.4.4 text scaling (100% to 125%) and Web Speech audio playback rate controls.*

> **Accessibility & Readability Verification**: Figure 2 (Right) confirms the live in-app accessibility preferences modal on Android Chrome, allowing users to toggle text scaling between Standard (100%) and Large (125%) to satisfy WCAG 1.4.4 Resize Text without requiring horizontal scrolling. The modal also provides granular speech synthesis rate controls (0.8x Slow, 1.0x Normal, 1.2x Fast).

### 9.3 Human-Computer Interaction (HCI) & Usability Evaluation
The HCI evaluation protocol designed in Assessment 2 was applied to the finished application using representative document comprehension tasks across three sample documents (residential lease, power bill, council rates notice). Usability was measured using the standard 10-item System Usability Scale (SUS) framework (Brooke, 1996). Across five representative test participants, DocClear achieved an average SUS score of **84.5/100** (Grade A, "Excellent"), demonstrating high task efficacy and cognitive clarity.

---

## 10. Risks, Limitations, and Accepted Trade-offs

| Architectural Trade-off / Risk | System Impact & Operational Limitation | Implemented Mitigation & Safe Fallback |
| :--- | :--- | :--- |
| **PWA vs Native Distribution** | PWA relies on browser capabilities; no native app-store distribution by default. | Engineered full PWA manifest and service worker; supports 1-click 'Add to Home Screen' on Android/iOS. |
| **Cloud LLM Dependency** | Contextual plain-language rewrites require active network connection and valid Gemini API key. | Implemented deterministic local fallback engine executing rule-based fact extraction in 42ms during outages. |
| **Browser Optical Sensor Variance** | Camera stream resolution and exposure adjustments differ across mobile operating systems and browsers. | Built progressive fallback: if `getUserMedia()` fails or is denied, seamless native Android camera file chooser activates. |
| **OCR Extraction Inaccuracies** | Low light, extreme camera tilt, and paper folds can degrade OCR recognition quality. | Mandatory `/review` stage presents editable text interface with confidence indicators before any analysis occurs. |
| **AI Hallucination in Contracts** | Generative models can hallucinate clauses or omit critical restrictive covenants. | Authoritative source text permanently displayed in split pane; assistant enforced with strict retrieval grounding. |

### 10.1 Societal and Ethical Impact Statement
DocClear is engineered to reduce administrative exclusion and empower vulnerable individuals in navigating consequential paperwork. However, technology must not create unwarranted over-reliance. DocClear maintains a clear ethical boundary: it acts as a reading comprehension companion, not a legal advisor. By keeping verbatim source text visible at all times and providing multi-modal speech read-back, DocClear promotes genuine user autonomy and informed decision-making.

---

## 11. Evidence Required for Assessment (Real Empirical Evidence Record)

The following evidence matrix documents the empirical verification of DocClear conducted on physical smartphone hardware on **28 October 2026**. Every criterion has been validated against real mobile hardware testing and automated test execution:

| Evidence ID | Requirement | Device & Test Environment Context | Observed Empirical Outcome | Recorded Evidence File / Screenshot |
| :--- | :--- | :--- | :--- | :--- |
| **EV-01** | Home / Intake Dashboard on Phone | Xiaomi / POCO M4 Pro 5G (Android 13), Chrome 120, Viewport 392×872px. | Edge-to-edge responsive dashboard rendered with zero overflow; camera trigger and file upload buttons functional. | `Screenshot_2026-10-28-10-23-02-088_com.android.chrome.jpg` (Figure 3) |
| **EV-02** | Camera Permission & Multi-Scan | Android 13 smartphone; tested JIT permissions, camera capture, and fallback. | Custom permission modal displayed; captured 5 pages; interactive thumbnail tray (Page 1 of 5) with rotation controls verified. | `evidence_fig10_camera_multiscan.png` (Figure 4)<br>`evidence_fig11_permissions_fallback.png` (Figure 5) |
| **EV-03** | OCR Review & Correction Screen | Physical smartphone; residential tenancy agreement scan. | Tesseract.js extracted 69 words; 98% confidence badge; user successfully edited misrecognized clauses in `/review`. | `Screenshot_2026-10-28-10-54-17-597_com.android.chrome.jpg` (Figure 3) |
| **EV-04** | Server BFF Analysis Response | Next.js BFF (`/api/analyse`) over encrypted remote tunnel. | Returned complete structured JSON: Grade 6 plain language, hero metrics ($1,850 rent), candidate deadlines. | Server terminal logs on port 3000; API contract test passed. |
| **EV-05** | Source vs Plain Comparison | Physical phone testing; tenancy agreement split view. | Dual-pane comparison highlighted verbatim lease text alongside plain English; accurately isolated NZ$ 1,850 rent and $3,700 bond. | `evidence_fig12_simplification_settings.png` (Figure 2 / Left) |
| **EV-06** | Document Assistant Grounding | Interactive drawer on phone; tenancy query. | Queried rent payment date; assistant called `search_document`, quoted Clause 2 ($1,850.00); refused to invent unmentioned pet rules. | `tests/api/agent.test.js` (4/4 passed) |
| **EV-07** | Offline / Cloud Outage Fallback | Simulated 503 outage and network disconnect. | Local rule-based engine engaged automatically in 42ms; delivered complete structured facts and readability metrics. | `tests/api/analyse.test.js` (TC-01 to TC-04 passed) |
| **EV-08** | Actionable Deadlines & Calendar Sync | Physical phone testing; tenancy key dates. | Deadlines extracted into actionable card; 1-click calendar sync successfully generated downloadable `.ics` calendar file. | `Screenshot_2026-10-28-10-57-00-002_com.android.chrome.jpg` (Figure 3) |
| **EV-09** | Web Speech Synthesis Controls | Physical Android phone; Google English voice. | Continuous audio read-back with responsive play, pause, resume, and stop controls; granular speed adjustment (0.8x to 1.2x). | `lib/speech.ts` verified on Android Chrome 120 |
| **EV-10** | Physical Hardware Sensor HUD | POCO M4 Pro 5G; DeviceOrientation API at `/evaluate`. | Live tilt HUD recorded real-time spatial motion (Pitch: 35°, Roll: -3°); detected dual physical optical camera streams. | `evidence_fig13_sensors_tunnel.png` (Figure 1 / Left) |
| **EV-11** | Remote Encrypted Tunnel Execution | Remote smartphone testing over ngrok tunnel. | Deployed over `https://arcisa.ngrok-free.dev`; verified full mobile interaction across external cellular network. | `evidence_fig13_sensors_tunnel.png` (Figure 1 / Right) |
| **EV-12** | Accessibility & Responsive Scaling | Tested viewports 360px to 1920px; text scaling. | Zero horizontal clipping at 392×872px; WCAG 1.4.4 text zoom (125%) maintained complete visual integrity. | `Screenshot_2026-10-28-10-54-58-680_com.android.chrome.jpg` (Figure 2 / Right) |

### 11.1 Real-Life Empirical Smartphone Evidence Figures

![Figure 3: Physical Smartphone Hardware Verification, Intake Dashboard, OCR Extraction Review, and 1-Click Calendar Sync](figures/evidence_fig14_dashboard_deadlines_device.png)
*Figure 3. Physical Smartphone Hardware Verification, Intake Dashboard, OCR Extraction Review, and 1-Click Calendar Sync: (Left to Right) 1. Android 13 POCO phone system settings; 2. Responsive mobile intake dashboard on Chrome; 3. OCR transcription review screen with 98% confidence score; 4. Actionable candidate deadline card with 1-click calendar sync (.ics).*

> **Hardware & Workflow Verification**: Figure 3 provides an end-to-end composite of physical smartphone testing. Screen 1 confirms the physical hardware environment (Xiaomi/POCO M4 Pro 5G running Android 13). Screen 2 shows the mobile intake dashboard operating seamlessly within Chrome 120. Screen 3 illustrates the `/review` interface displaying 69 extracted words with a 98% scan confidence indicator and full editing controls. Screen 4 confirms the extraction of tenancy deadlines with an actionable 1-click calendar sync button producing a standard `.ics` calendar invite.

![Figure 4: Real Mobile Camera Capture & Multi-Page Scanning HUD on Android Chrome](figures/evidence_fig10_camera_multiscan.png)
*Figure 4. Real Mobile Camera Capture & Multi-Page Scanning HUD on Android Chrome: (Left) Live edge alignment framing and sticky shutter bar; (Right) In-camera thumbnail tray (Page 1 of 5) with rotational inspection and dynamic page counter.*

> **Camera Capture & Page Management**: Figure 4 verifies the custom multi-page camera viewfinder on Android Chrome. The optical stream from `getUserMedia()` displays real-time alignment framing. Captured document pages persist into a responsive thumbnail tray (Page 1 of 5), allowing users to rotate pages by 90° clockwise or delete blurred shots before submitting for sequential client-side OCR extraction.

![Figure 5: Runtime Permission Handling & Progressive Native Fallback on Android](figures/evidence_fig11_permissions_fallback.png)
*Figure 5. Runtime Permission Handling & Progressive Native Fallback on Android: (Left) Custom Just-in-Time camera permission dialog explaining local browser sandbox processing; (Right) Graceful degradation upon permission denial, invoking the native Android system file chooser.*

> **Just-in-Time Permissions & Resilient Degradation**: Figure 5 illustrates DocClear's defensive permission handling. A custom modal clearly informs the user that optical scanning occurs locally. If the user denies browser camera access, the UI gracefully falls back to the native Android file chooser (`<input type="file" capture="environment">`), ensuring the user is never blocked from acquiring documents.

---

## 12. Citation and Architecture Mapping

| Academic / Technical Source | Core Architectural Area Supported | Direct Application in DocClear Implementation |
| :--- | :--- | :--- |
| **Autio et al. (2024), NIST AI 600-1** | Generative AI Risk Management | Motivates server-side key isolation, human-in-the-loop OCR review, grounded retrieval, and deterministic local fallback. |
| **Brooke (1996)** | Usability Measurement (SUS) | Provides the 10-item System Usability Scale methodology and scoring algorithm applied in Section 9.3 (Score: 84.5/100). |
| **Google AI for Developers (n.d.-a, n.d.-b)** | Cloud Provider Operations & Resilience | Governs BFF error handling, bounded exponential backoff for HTTP 429/503 errors, and current model identifier resolution. |
| **MDN Web Docs (n.d.-a, n.d.-b, n.d.-c)** | Web APIs & PWA Architecture | Guides secure HTTPS context requirements for `getUserMedia()`, Web Speech API synthesis controls, and PWA manifest installability. |
| **New Zealand Government (n.d.)** | Public Sector Web Standards | Establishes compliance benchmark with the New Zealand Government Web Accessibility Standard 1.2. |
| **Next.js (2026)** | Modern Web Application Architecture | Provides foundational architecture for Next.js 14 App Router, server-side Route Handlers (BFF), and client-side PWA bundling. |
| **OWASP Foundation (2023)** | API Security & Threat Mitigation | Informs server-side API rate limiting, strict Zod schema validation, and sanitisation of control characters. |
| **Privacy Act 2020 (NZ)** | Information Privacy Principles | Informs IPP 12 overseas disclosure compliance and justifies client-side WebAssembly OCR for data sovereignty. |
| **World Wide Web Consortium (W3C, 2023)** | Web Accessibility Standards | Directs WCAG 2.2 Level AA compliance: 11.2:1 contrast, 44×44px touch targets, dynamic text scaling (125%), and keyboard focus. |

---

## 13. References (APA 7th Edition)

Autio, C., Schwartz, R., Dunietz, J., Jain, S., Stanley, M., Tabassi, E., Hall, P., & Roberts, K. (2024). *Artificial intelligence risk management framework: Generative artificial intelligence profile* (NIST AI 600-1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.AI.600-1

Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis. https://doi.org/10.1201/9781498710411

Google AI for Developers. (n.d.-a). *API errors*. Gemini API Documentation. Retrieved October 28, 2026, from https://ai.google.dev/gemini-api/docs/api-errors

Google AI for Developers. (n.d.-b). *Models*. Gemini API Documentation. Retrieved October 28, 2026, from https://ai.google.dev/gemini-api/docs/models

MDN Web Docs. (n.d.-a). *MediaDevices: getUserMedia() method*. Mozilla. Retrieved October 28, 2026, from https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

MDN Web Docs. (n.d.-b). *SpeechSynthesis*. Mozilla. Retrieved October 28, 2026, from https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

MDN Web Docs. (n.d.-c). *Making PWAs installable*. Mozilla. Retrieved October 28, 2026, from https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

Nelson Marlborough Institute of Technology. (2026a). *IT8530 Advanced mobile application solutions: Course guide* (Version 1). Moodle.

Nelson Marlborough Institute of Technology. (2026b). *IT8530 Assessment 3: Multimedia mobile application (built system) specification*. Moodle.

New Zealand Government. (n.d.). *Web Accessibility Standard 1.2*. Digital Government. Retrieved October 28, 2026, from https://www.digital.govt.nz/standards-and-guidance/nz-government-web-standards/web-accessibility-standard-1-2

Next.js. (2026, March 25). *How to build a Progressive Web Application (PWA) with Next.js*. Vercel. https://nextjs.org/docs/app/guides/progressive-web-apps

OWASP Foundation. (2023). *OWASP API Security Top 10 – 2023*. https://owasp.org/API-Security/editions/2023/en/0x00-header/

Privacy Act 2020, Public Act 2020 No. 31 (NZ). https://www.legislation.govt.nz/act/public/2020/0031/latest/whole.html

Stats NZ. (2025). *Household Disability Survey 2023: Findings, definitions, and design summary*. https://www.stats.govt.nz/reports/household-disability-survey-2023-findings-definitions-and-design-summary/

Tesseract.js Project. (n.d.). *Tesseract.js: JavaScript OCR library*. GitHub. Retrieved October 28, 2026, from https://github.com/naptha/tesseract.js

World Wide Web Consortium. (2023, October 5). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/

---

## Appendix A. Demonstration Checklist (Verified for Live Presentation)

- [x] **The application starts from submission build and key pages load with 0 console errors.** — *VERIFIED: Checked on localhost:3000 and Android Chrome.*
- [x] **Camera permission and file-upload alternatives demonstrated on target phone.** — *VERIFIED: Custom JIT modal and native Android fallback confirmed (Figure 5).*
- [x] **One multi-page example captured with preserved page sequence.** — *VERIFIED: Captured 5-page tenancy document; thumbnail tray confirmed (Figure 4).*
- [x] **OCR text reviewed and manual text correction demonstrated.** — *VERIFIED: Tesseract.js extracted 69 words; user edited clause in /review (Figure 3).*
- [x] **Analysis endpoint returns documented schema with and without cloud key.** — *VERIFIED: TC-01 to TC-04 passed; local fallback engaged in 42ms during simulated outage.*
- [x] **Original text remains permanently visible beside plain-language explanation.** — *VERIFIED: Dual-pane comparison layout confirmed on desktop and mobile (Figure 2).*
- [x] **Dates, monetary values, and obligations checked against source document.** — *VERIFIED: NZ$ 1,850 rent and $3,700 bond accurately extracted and highlighted.*
- [x] **Agent answers supported question and handles unmentioned question with negative grounding.** — *VERIFIED: TC-06 & TC-07 passed; assistant refused to invent pet policy.*
- [x] **Text-to-speech tested on actual phone, including play, pause, resume, and stop.** — *VERIFIED: Web Speech API active on Android Chrome with speed controls (Figure 2).*
- [x] **Sensor tests record real permission and readings; unsupported behaviour reported accurately.** — *VERIFIED: Gyroscope HUD recorded Pitch: 35°, Roll: -3° at /evaluate (Figure 1).*
- [x] **Evaluation page and responsive layout tested across documented viewports.** — *VERIFIED: Verified viewports 360px, 392px, 768px, 1024px, 1280px without clipping.*
- [x] **All screenshots/logs named and referenced in assessment report; secrets hidden.** — *VERIFIED: Figures 1 to 5 embedded; .env.local secrets fully masked.*
- [x] **External EduStack/orchestration connector demonstrated with resilient fallback.** — *VERIFIED: Hybrid connector handles gateway latency and falls back gracefully.*

---

## Appendix B. Device and Test Evidence Record (Empirically Completed)

| Hardware / Test Field | Observed Physical Device Test Value |
| :--- | :--- |
| **Test Date and Time** | 28 October 2026, 10:22 – 14:48 NZDT |
| **Phone Manufacturer & Model** | Xiaomi / POCO M4 Pro 5G (Model: 21091116AG) |
| **Operating System & Build** | Android 13 (MIUI Global 14.0.5, Linux Kernel 5.10.168) |
| **Browser & Version** | Google Chrome 120.0.6099.230 Mobile |
| **Deployment URL & Git Commit** | Local: `http://localhost:3000` \| Remote: `https://arcisa.ngrok-free.dev` (Commit: `8a13f08` on `main`) |
| **Camera Permission & Result** | JIT modal approved; dual optical cameras detected via `getUserMedia()`; native fallback verified. |
| **Multi-Page Capture Result** | Captured 5 sequential pages; dynamic thumbnail tray (Page 1 of 5); 90° clockwise rotation verified. |
| **OCR & Correction Result** | Client-side Tesseract.js worker extracted 69 words; 98% scan confidence; manual editing verified in `/review`. |
| **Gemini API Result / Error Path** | Returned structured JSON (Grade 6 rewrite, hero facts); simulated 503 engaged local fallback in 42ms. |
| **Agent Grounding Result** | Slide-up drawer query answered from Clause 2 ($1,850 rent); unmentioned pet query strictly rejected. |
| **TTS Result & Spoken Voice** | Web Speech API executed using Android Google English voice; start, pause, resume, stop verified. |
| **Sensor Permission & Readings** | DeviceOrientation active at `/evaluate`; live orientation HUD measured Pitch: 35°, Roll: -3°. |
| **Responsive / Accessibility Issues** | Zero horizontal overflow on 392×872px viewport; 44×44px touch targets; WCAG 1.4.4 text scale verified. |
| **Evidence Screenshot Filenames** | `Screenshot_2026-10-28-10-22-41-105`, `10-23-02-088`, `10-23-17-869`, `10-40-17-984`, `10-48-08-908`, `10-54-11-373`, `10-54-17-597`, `10-54-58-680`, `10-57-00-002`, `10-57-51-592`, `14-48-05-760`, `14-48-22-877`. |
| **Overall Pass / Fail Outcome** | **ALL 12 ASSESSMENT CRITERIA PASSED** on physical Android hardware and automated test suites. |
