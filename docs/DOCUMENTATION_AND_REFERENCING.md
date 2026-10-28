# IT8530 Documentation and Referencing Guide (LO3 & LO4)
**Course:** IT8530 Advanced Mobile Application Solutions  
**Project:** DocClear – Accessible Document Understanding Application  
**Learning Outcomes Addressed:**
* **LO3:** Design and implement mobile application solutions integrating multimedia, platform sensors, and orchestration services.
* **LO4:** Critically evaluate and document application impact, platform suitability, and system architecture with academic and technical referencing.

---

## 1. Executive Understanding of DocClear

### 1.1 Problem Solved
Everyday citizens, tenants, and patients frequently face consequential documents—such as residential tenancy agreements, medical co-payment invoices, and municipal council notices—written in dense, archaic legalese (typically scoring Grade 14 to 18 on the Flesch-Kincaid reading scale). Vulnerable users (including English-as-a-second-language immigrants, elderly readers, and people with cognitive or visual impairments) experience severe cognitive overload trying to identify actionable obligations. A misunderstanding of a 7-day arrears threshold or financial penalty carries harsh real-world consequences, such as eviction, credit destruction, or loss of healthcare services.

DocClear resolves this barrier by providing an accessible, trust-centered mobile web application. It empowers users to photograph a physical document or upload a digital file, review and correct the optical character recognition (OCR) transcription in real time (preventing error compounding), and examine a plain-language explanation side-by-side with the source document. Actionable deadlines and monetary amounts are extracted into dedicated cards, accompanied by synchronized text-to-speech (TTS) audio and an autonomous local failover engine that operates even without internet connectivity.

### 1.2 System Architecture & Flow
```
[User / Mobile Device]
       │  (1. Photograph / Upload Document)
       ▼
[Client-Side OCR Tier (Tesseract.js Web Worker)]
       │  (2. Verified Transcription Text)
       ▼
[Next.js Backend-for-Frontend (BFF) Tier: /api/analyse]
       │
       ├──► [Primary Cloud Engine: Google Gemini Flash API] (Deep contextual rewrite)
       │         │ (If 429 / 503 / Timeout / Offline)
       └──► [Local Deterministic Analytical Engine] (<50ms failover, 0 dependencies)
                 │
                 ▼
[Client Presentation Tier: /comparison]
       │  - Side-by-side source & Grade 5–7 plain language
       │  - Actionable candidate deadline cards
       │  - Synchronized Web Speech API audio player
       │  - Grounded AI Document Agent (/api/agent/chat)
       ▼
[Device Sensors & Evaluation Tier: /evaluate]
       - Real-time hardware diagnostics via User-Agent Client Hints
       - Live motion sensor (Pitch & Roll) tilt HUD
       - Interactive SUS usability calculator & 10-point heuristic checklist
```

---

## 2. Step-by-Step Installation & Execution Guide

### 2.1 Prerequisites
Ensure the target machine has the following tools installed:
1. **Node.js**: Version 18.17+ or 20 LTS (`node -v` and `npm -v`).
2. **Git**: Distributed version control (`git --version`).
3. **Web Browser**: Google Chrome or Microsoft Edge (recommended for native camera streaming, SpeechSynthesis voices, and sensor APIs).

### 2.2 Repository Setup & Checkout
Clone the source code repository from Gitea:
```bash
# Clone the repository
git clone http://192.168.10.10:3000/Jesse/Doc_Clear.git

# Enter the application root
cd Doc_Clear
```
*(If the repository is already cloned, pull the latest commits with `git pull origin main`).*

### 2.3 Secret Management & `.env.local` Configuration
DocClear enforces strict **server-side secret isolation**. Client-side JavaScript bundles never receive secret credentials.

1. Create `.env.local` from the provided template:
   * **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env.local
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env.local
     ```

2. Configure `.env.local`:
   ```env
   NEXT_PUBLIC_APP_NAME="Doc Clear"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Google Gemini API Key for online cloud plain-language rewriting
   # Obtain a free key at: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY="your_api_key_here"
   GEMINI_MODEL="gemini-flash-latest"

   # Fallback Orchestration Settings (EduStack Lite)
   EDUSTACK_BFF_URL="http://localhost:8080"
   EDUSTACK_MODE="hybrid"
   ```

> [!NOTE]
> **Zero-Dependency Fallback:** If `GEMINI_API_KEY` is omitted or left empty, DocClear automatically engages its local analytical engine. The application remains 100% operational offline, calculating Flesch-Kincaid metrics and extracting candidate dates in under 50ms without external API calls.

### 2.4 Installing Dependencies & Verification
Install all node dependencies:
```bash
npm install
```
Verify TypeScript integrity:
```bash
npx tsc --noEmit
```

### 2.5 Launching the Development Server
Start the local Next.js server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 3. Clearly Organised Repository Structure

The DocClear codebase is structured cleanly into logical layers following the Next.js 14 App Router pattern:

```
docclear/
├── app/                                    # Next.js 14 App Router & BFF endpoints
│   ├── api/                                # Backend-for-Frontend (BFF) REST APIs
│   │   ├── agent/chat/route.ts             # AI agent grounded document chat endpoint
│   │   ├── analyse/route.ts                # Dual-engine simplification & readability API
│   │   └── extract-doc/route.ts            # Multipart file extraction endpoint
│   ├── comparison/page.tsx                 # Dual-pane comparison & sticky audio player
│   ├── evaluate/page.tsx                   # Hardware diagnostics & HCI evaluation page
│   ├── review/page.tsx                     # OCR text review & human-in-the-loop editor
│   ├── globals.css                         # Global Tailwind styles and animations
│   ├── layout.tsx                          # Root layout, Navbar, and Footer
│   └── page.tsx                            # Document ingestion & camera capture hub
│
├── components/                             # Reusable, accessible UI components
│   ├── agent/                              # Interactive AI Document Assistant
│   │   ├── AgentThinkingOrbCanvas.tsx      # Canvas-based thinking visualizer
│   │   └── DocumentAgentDrawer.tsx         # Slide-up chat drawer with grounded tools
│   ├── capture/                            # Multimedia Document Acquisition
│   │   └── CameraCapture.tsx               # 5-page scanner, sticky shutter, rotation
│   ├── comparison/                         # Analysis & Presentation Components
│   │   └── ComparisonView.tsx              # Side-by-side view, deadlines, audio scrubber
│   ├── evaluation/                         # Diagnostics & Heuristic Testing
│   │   └── SensorDiagnostics.tsx           # Client Hints, live tilt gyro, sensor cards
│   ├── layout/                             # Structural Shell Components
│   │   ├── Footer.tsx                      # Accessibility notices and version info
│   │   └── Navbar.tsx                      # Top navigation and routing links
│   ├── review/                             # OCR Transcription Components
│   │   └── TextReviewEditor.tsx            # Editable review textarea with word metrics
│   └── ui/                                 # Base Design System Primitives
│       ├── Alert.tsx                       # Accessible alert banners
│       ├── Button.tsx                      # 44x44px touch-target action buttons
│       └── PermissionDialog.tsx            # Native OS-style camera & storage prompts
│
├── docs/                                   # Project Documentation & Academic Artifacts
│   ├── architecture.md                     # System architecture & security specification
│   ├── assessment1_report.md               # Assessment 1 report (Markdown mirror)
│   ├── DOCUMENTATION_AND_REFERENCING.md   # This comprehensive LO3/LO4 manual
│   ├── hci-evaluation.md                   # Heuristic evaluation & SUS test protocol
│   ├── IT8530_Assessment1_DocClear_UPDATED.docx # Formatted Assessment 1 submission file
│   ├── requirements.md                     # Functional and non-functional requirements
│   ├── STUDENT_TECHNICAL_SETUP_GUIDE.md    # Step-by-step developer setup handbook
│   └── test-plan.md                        # Unit, contract, and accessibility test plan
│
├── lib/                                    # Domain Logic, Helpers, and Utilities
│   ├── agent/tools.ts                      # Tool declarations for AI clause search
│   ├── edustack/connector.ts               # Upstream EduStack Lite gateway adapter
│   ├── ocr.ts                              # Tesseract.js worker & image rotation
│   ├── readability.ts                      # Mathematical Flesch-Kincaid formula
│   ├── speech.ts                           # Web Speech API controller
│   ├── utils.ts                            # Tailwind CSS class merging helper
│   └── validation.ts                       # Input sanitization and non-document filters
│
├── public/                                 # Static Assets & PWA Web App Manifest
│   ├── favicon.ico                         # Favicon icon
│   ├── frame_1_mobile_home.svg             # UI design wireframe: Home screen
│   ├── frame_2_camera_scanner.svg          # UI design wireframe: Camera scanner
│   ├── frame_3_ocr_review.svg              # UI design wireframe: OCR review
│   ├── frame_4_results_dashboard.svg       # UI design wireframe: Comparison dashboard
│   ├── manifest.json                       # Progressive Web App configuration
│   └── icons/                              # Multi-resolution PWA app icons
│
├── tests/                                  # Automated Test Suites
│   └── api/
│       ├── agent.test.js                   # AI agent tool-calling & anti-hallucination tests
│       └── analyse.test.js                 # Flesch-Kincaid & BFF contract validation tests
│
├── .env.example                            # Public environment template
├── .gitignore                              # Prevents secrets and office files from Git
├── package.json                            # Project dependencies and script declarations
├── tailwind.config.ts                      # Tailwind styling configuration
└── tsconfig.json                           # TypeScript compiler configuration
```

---

## 4. Automated Testing Suite

DocClear includes automated unit and contract test suites verifying both analytical accuracy and AI agent safety:

```bash
# 1. Run BFF Document Analysis & Flesch-Kincaid Readability Tests
node tests/api/analyse.test.js

# 2. Run AI Document Agent Tool-Calling & Hallucination Resistance Tests
node tests/api/agent.test.js
```

### Test Assertions Covered:
* **TC-01 (Empty Text Handling):** Ensures empty scans or blank camera frames return graceful errors.
* **TC-02 (Input Sanitization):** Verifies malicious null bytes and control characters are stripped.
* **TC-03 (Flesch-Kincaid Complexity):** Verifies complex legalese (Grade 18) scores strictly higher than simplified output (Grade 3.7).
* **TC-04 (Entity Extraction):** Verifies monetary figures (`$1,850.00`) and due dates (`November 15`) are extracted cleanly.
* **TC-05 (Clause Segmentation):** Validates structured parsing of legal clauses.
* **TC-06 (Agent Tool Calling):** Tests `search_document` and `find_deadlines` retrieval against verified ground truth.
* **TC-07 (Negative Grounding):** Confirms that when asked about an unmentioned topic (e.g., "pets policy"), the AI agent strictly refuses to hallucinate and cites missing evidence.

---

## 5. References (APA 7th Edition)

The following peer-reviewed literature, government standards, specifications, and platform documentation informed the architectural, social, and technical design of DocClear:

Autio, C., Schwartz, R., Dunietz, J., Jain, S., Stanley, M., Tabassi, E., Hall, P., & Roberts, K. (2024). *Artificial intelligence risk management framework: Generative artificial intelligence profile* (NIST AI 600-1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.AI.600-1

Digital.govt.nz. (n.d.). *About the Web Accessibility Standard 1.2*. New Zealand Government. https://digital.govt.nz/standards-and-guidance/nz-government-web-standards/web-accessibility-standard-1-2/about-the-web-accessibility-standard

Expo. (n.d.-a). *Camera*. https://docs.expo.dev/versions/latest/sdk/camera/

Expo. (n.d.-b). *Develop websites with Expo*. https://docs.expo.dev/workflow/web/

Expo. (n.d.-c). *ImagePicker*. https://docs.expo.dev/versions/latest/sdk/imagepicker/

Google. (n.d.). *Accessibility in Jetpack Compose*. Android Developers. https://developer.android.com/develop/ui/compose/accessibility

Google AI for Developers. (n.d.-a). *API errors*. Gemini API. https://ai.google.dev/gemini-api/docs/api-errors

Google AI for Developers. (n.d.-b). *Troubleshooting guide*. Gemini API. https://ai.google.dev/gemini-api/docs/troubleshooting

MDN Web Docs. (n.d.-a). *HTML input capture attribute*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture

MDN Web Docs. (n.d.-b). *Making PWAs installable*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

MDN Web Docs. (n.d.-c). *MediaDevices: getUserMedia() method*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

MDN Web Docs. (n.d.-d). *SpeechSynthesis*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

Nelson Marlborough Institute of Technology. (2026a). *IT8530 Advanced mobile application solutions: Course guide* (Version 1). Moodle.

Nelson Marlborough Institute of Technology. (2026b). *IT8530 lecture 01: Introduction to mobile applications* [Lecture slides]. Moodle.

Next.js. (2026, July 30). *How to build a Progressive Web Application (PWA) with Next.js*. https://nextjs.org/docs/app/guides/progressive-web-apps

OWASP Foundation. (2023). *OWASP API security top 10 – 2023*. https://owasp.org/API-Security/editions/2023/en/0x00-header/

Privacy Act 2020 (NZ). https://www.legislation.govt.nz/pdflink.aspx?id=DLM7298371

Stats NZ. (2025). *Household Disability Survey 2023 – findings, definitions, and design summary*. https://www.stats.govt.nz/reports/household-disability-survey-2023-findings-definitions-and-design-summary/

World Health Organization. (2023, March 7). *Disability*. https://www.who.int/news-room/fact-sheets/detail/disability-and-health

World Wide Web Consortium. (2023, October 5). *Web content accessibility guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/

World Wide Web Consortium. (2025, May 6). *Guidance on applying WCAG 2.2 to mobile applications (WCAG2Mobile)* (W3C Group Draft Note). https://www.w3.org/TR/wcag2mobile-22/

---

## 6. Citation & Architectural Mapping Table

| Cited Source | Key Domain | Architectural Impact on DocClear |
| :--- | :--- | :--- |
| **Autio et al. (2024) [NIST AI 600-1]** | Generative AI Risk | Grounded retrieval tools (`tools.ts`) that strictly refuse to hallucinate when evidence is missing. |
| **Privacy Act 2020 (NZ)** | Privacy & Data Protection | Client-side OCR (`Tesseract.js`) so images are processed locally without overseas data transfer. |
| **W3C (2023, 2025) [WCAG 2.2]** | Accessibility Standards | 44x44px minimum touch targets, visible focus outlines, dynamic font resizing (`A-` to `A++`), and high-contrast color palette. |
| **OWASP Foundation (2023)** | API Security | Rate limiting, input sanitization, and server-side isolation of `GEMINI_API_KEY` in `.env.local`. |
| **Google AI for Developers (n.d.)** | Cloud Orchestration | Exponential backoff for HTTP 429/503 and automatic circuit-breaker fallback to local engine. |
| **MDN Web Docs (n.d.-c, n.d.-d)** | Multimedia APIs | Progressive fallback from `getUserMedia()` to `<input type="file">`, and wall-clock ticker for `SpeechSynthesis`. |
| **Stats NZ (2025) & WHO (2023)** | Social Inclusion | Design rationale accommodating 16–17% of the population experiencing visual, cognitive, or reading disabilities. |
