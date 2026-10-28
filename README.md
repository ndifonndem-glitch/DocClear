# DocClear - Cognitive Mobile Document Simplifier (Frontend & BFF)

**Course:** IT8530 Advanced Mobile Application Solutions  
**Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS  
**Target:** Mobile PWA (Progressive Web App) + Desktop Responsive  

> 📖 **Looking for a student-friendly, step-by-step setup guide?**  
> Check out the complete handbook: [**`docs/STUDENT_TECHNICAL_SETUP_GUIDE.md`**](docs/STUDENT_TECHNICAL_SETUP_GUIDE.md)

---

## Quick Setup & Run

### Prerequisites
* **Node.js**: v18.17+ or v20 LTS (Recommended)
* **Git**: Installed and configured
* **Browser**: Google Chrome or Microsoft Edge

### 1. Clone / Pull from Gitea
```bash
# Clone the repository
git clone http://192.168.10.10:3000/Jesse/Doc_Clear.git
cd Doc_Clear

# Or pull the latest changes
git pull origin main
```

### 2. Install Dependencies
Navigate into the `docclear` directory and install project dependencies:
```bash
npm install
```

### 3. Environment Configuration (`.env.local`)
Copy the example environment file to `.env.local`:
```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```
Open `.env.local` and add your Google Gemini API key:
```env
NEXT_PUBLIC_APP_NAME="Doc Clear"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google Gemini API Key for online AI simplification
# Get your free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-flash-latest"

# Fallback Orchestration Settings
EDUSTACK_BFF_URL="http://localhost:8080"
EDUSTACK_MODE="hybrid"
```
*(Note: If no Gemini key is provided, DocClear's internal offline deterministic engine automatically parses, simplifies, and extracts action items with zero network latency).*

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 5. Run Automated Tests
```bash
node tests/api/analyse.test.js
node tests/api/agent.test.js
```

### 4. Build for Production
To test production performance and Lighthouse audits:
```bash
npm run build
npm run start
```

---

## Core Features & Application Routes

| Route | Feature | Key Capabilities |
| :--- | :--- | :--- |
| `/` | **Document Ingestion** | Drag-and-drop or camera capture for PDF, DOCX, TXT, PNG, and JPG. Multi-engine client-side OCR via Tesseract.js. |
| `/review` | **Extraction & Verification** | Preview extracted text before sending to AI simplification engine. |
| `/comparison` | **Dual-Pane Simplification** | Original vs Plain Language comparison, Grade 6 readability scoring, interactive terminology glossary, and sticky bottom TTS audio player. |
| `/evaluate` | **HCI Evaluation Dashboard** | Interactive 10-Item SUS Calculator (with auto-save & export), 10-Point Mobile Heuristic Checklist, and Benchmark task protocol. |

---

## Testing & HCI Evaluation
Visit [`http://localhost:3000/evaluate`](http://localhost:3000/evaluate) to run:
- **System Usability Scale (SUS)**: Form auto-persists answers to browser local storage. Click **"Download .TXT for Report"** or **"Copy Score Summary"** for your assessment appendix.
- **Heuristic Checklist**: 10-point Nielsen-Molich & WCAG 2.2 mobile checklist with empirical severity ratings (0 to 4).
