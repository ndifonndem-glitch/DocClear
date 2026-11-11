# DocClear - Cognitive Mobile Document Simplifier (PWA & BFF)

**Course:** IT8530 Advanced Mobile Application Solutions  
**Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS  
**Repository:** [https://github.com/ndifonndem-glitch/DocClear](https://github.com/ndifonndem-glitch/DocClear) (branch `main`)  
**Target:** Mobile Progressive Web App (PWA) + Responsive Desktop

> **Setup & Mobile Testing Guides:**  
> - [**`docs/STUDENT_TECHNICAL_SETUP_GUIDE.md`**](docs/STUDENT_TECHNICAL_SETUP_GUIDE.md)  
> - [**`SIMPLE_MOBILE_SETUP_GUIDE.md`**](SIMPLE_MOBILE_SETUP_GUIDE.md)

---

## Quick Setup & Run

### Prerequisites
* **Node.js**: v18.17+ or v20 LTS (Recommended)
* **Git**: Installed and configured
* **Browser**: Google Chrome (Android / Desktop) or Apple Safari (iOS)

### 1. Clone from GitHub
```bash
git clone https://github.com/ndifonndem-glitch/DocClear.git
cd DocClear
```

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Environment Configuration (`.env.local`)
Copy `.env.example` to `.env.local` (never commit `.env.local`):
```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```
Optional Google Gemini configuration inside `.env.local`:
```env
NEXT_PUBLIC_APP_NAME="Doc Clear"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Free-tier or paid Google Gemini API Key (see https://aistudio.google.com/app/apikey)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-flash-latest"
```
*(Without a `GEMINI_API_KEY`—or when Gemini is unavailable—DocClear's Next.js `/api/analyse` BFF automatically falls back to its built-in deterministic analytical engine so core simplification, readability metrics, deadlines, and vocabulary extraction still work.)*

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. For physical smartphone camera testing over HTTPS, expose port `3000` through an HTTPS tunnel (for example, `ngrok http 3000`).

### 5. Run Automated Tests & Production Build
```bash
node tests/api/analyse.test.js
node tests/api/agent.test.js
npm run build
```

---

## Core Features & Application Routes

| Route | Feature | Key Capabilities |
| :--- | :--- | :--- |
| `/` | **Document Ingestion** | Drag-and-drop or camera capture (up to 5 pages) for PDF, DOCX, TXT, PNG, and JPG. On-device client-side OCR via Tesseract.js Web Worker and server-side text extraction at `/api/extract-doc`. |
| `/review` | **OCR Verification & Consent** | Editable OCR review with confidence badge, Flesch-Kincaid grade preview, pre-simplify external processing notice, and `?fail=` recovery simulation states (`low`, `busy`, `down`, `bad`, `large`, `malformed`, `slow`, `timeout`). |
| `/comparison` | **Dual-Pane Simplification** | Original vs Plain Language comparison, hero metrics, `.ics` / Google / Outlook smart calendar popover, continuous Web Speech audio player (`0.8x`–`2x`), and grounded Document Agent drawer (`/api/agent/chat`). |
| `/evaluate` | **HCI Evaluation Dashboard** | Interactive 10-Item SUS Calculator (Brooke, 1996), 12-item Nielsen & WCAG 2.2 checklist (defaulting to `untested`), 4 benchmark tasks, and live mobile device/sensor diagnostics. |
