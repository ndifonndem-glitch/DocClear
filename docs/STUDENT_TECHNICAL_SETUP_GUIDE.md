# DocClear: Student Technical Setup & Developer Guide
**Course:** IT8530 Advanced Mobile Application Solutions  
**Project:** DocClear – Accessible Document Understanding Application  
**Target:** Next.js 14 Progressive Web App (PWA) + Responsive Desktop  

---

## Table of Contents
1. [Overview & Tech Stack](#1-overview--tech-stack)
2. [Prerequisites (What to Install First)](#2-prerequisites-what-to-install-first)
3. [Step 1: Pulling / Cloning from Gitea](#3-step-1-pulling--cloning-from-gitea)
4. [Step 2: Environment Setup & Gemini API Key (`.env.local`)](#4-step-2-environment-setup--gemini-api-key-envlocal)
5. [Step 3: Installing Dependencies](#5-step-3-installing-dependencies)
6. [Step 4: Launching the Local Server](#6-step-4-launching-the-local-server)
7. [Step 5: Testing Core Application Features](#7-step-5-testing-core-application-features)
8. [Step 6: Running Automated Test Suites](#8-step-6-running-automated-test-suites)
9. [Troubleshooting & Frequently Asked Questions (FAQ)](#9-troubleshooting--frequently-asked-questions-faq)

---

## 1. Overview & Tech Stack

DocClear is a mobile-first multimedia web application designed to help people understand complex legal, medical, and administrative documents (such as tenancy agreements, council notices, and healthcare bills).

### Core Architecture:
* **Frontend Framework:** Next.js 14 (App Router) with React 18 & TypeScript.
* **Styling & Icons:** Tailwind CSS with Lucide React icons.
* **Multimedia Hardware APIs:**
  * **Camera & Scanner:** HTML5 `MediaDevices.getUserMedia()` with progressive file-upload fallback.
  * **Optical Character Recognition (OCR):** In-browser `Tesseract.js` for on-device document text extraction.
  * **Voice Synthesis (TTS):** Web Speech API (`speechSynthesis`) with interactive progress scrubbing.
  * **Hardware Sensors:** DeviceOrientation API for real-time device pitch/roll tilt detection.
* **Backend-for-Frontend (BFF):**
  * `POST /api/extract-doc`: Handles multi-format document uploads (PDF, DOCX, TXT, images).
  * `POST /api/analyse`: Dual-engine orchestration (Google Gemini Cloud API + Autonomous Local Fallback).
  * `POST /api/agent/chat`: Interactive AI assistant with grounded document search tools.

---

## 2. Prerequisites (What to Install First)

Before running the project, make sure your computer has the following tools installed:

### 1. Node.js (Version 18.17+ or 20 LTS Recommended)
* Check if installed by opening your terminal or PowerShell and typing:
  ```bash
  node -v
  npm -v
  ```
* If not installed, download the **LTS (Long Term Support)** version from [nodejs.org](https://nodejs.org/).

### 2. Git
* Check if installed:
  ```bash
  git --version
  ```
* If not installed, download it from [git-scm.com](https://git-scm.com/).

### 3. Recommended Web Browser
* **Google Chrome** or **Microsoft Edge** is recommended because they provide full support for browser camera streaming, SpeechSynthesis voices, and sensor APIs.

### 4. Code Editor
* **Visual Studio Code (VS Code)** or **Antigravity**.

---

## 3. Step 1: Pulling / Cloning from Gitea

### Option A: If you are setting up the project for the first time (Fresh Clone)
1. Open your terminal or PowerShell.
2. Navigate to your desired working directory (e.g. `C:\Projects` or `~/Desktop`):
   ```bash
   cd ~/Desktop
   ```
3. Clone the repository from the local Gitea server:
   ```bash
   git clone http://192.168.10.10:3000/Jesse/Doc_Clear.git
   ```
4. Enter the cloned directory:
   ```bash
   cd Doc_Clear
   ```
   *(Note: Depending on how the repo is structured, if the Next.js app is inside a `docclear` subfolder, run `cd docclear`).*

### Option B: If you already have the repository on your machine (Pull Latest Code)
1. Open terminal inside the project directory:
   ```bash
   cd docclear
   ```
2. Fetch and pull all recent commits from Gitea:
   ```bash
   git pull origin main
   ```
3. Verify that your branch is up to date:
   ```bash
   git status
   ```

---

## 4. Step 2: Environment Setup & Gemini API Key (`.env.local`)

DocClear uses environment variables to configure app settings and external AI integrations.

### Where should the file be?
The file must be named **`.env.local`** and must be placed in the root of the `docclear` project (right next to `package.json`).

```
docclear/
├── app/
├── components/
├── lib/
├── package.json
├── .env.example     <-- Reference template (tracked in git)
└── .env.local       <-- Your secret config (NEVER pushed to git)
```

### How to Create `.env.local`:
1. In your terminal inside the `docclear` directory, copy the template:
   * **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env.local
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env.local
     ```

2. Open `.env.local` in your editor. You will see:
   ```env
   # DocClear Environment Variables
   NEXT_PUBLIC_APP_NAME="Doc Clear"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Google Gemini API Key (For online AI plain-language rewriting)
   # Obtain a free key at: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY="your_api_key_here"
   GEMINI_MODEL="gemini-flash-latest"

   # Fallback Orchestration Settings (EduStack Lite)
   EDUSTACK_BFF_URL="http://localhost:8080"
   EDUSTACK_MODE="hybrid"
   ```

### How to Get a Free Google Gemini API Key:
1. Go to [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey).
2. Sign in with your personal Google account.
3. Click the blue **"Create API key"** (or **"Get API key"**) button.
4. Select or create a Google Cloud project.
5. Copy the generated key string (it typically starts with `AIzaSy...`).
6. Paste the key into your `.env.local` file:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeneratedSecretKeyHere"
   ```
7. Save the file.

> [!IMPORTANT]
> **Why is `.env.local` never pushed to Gitea?**  
> `.env.local` is listed in `.gitignore`. Client-side code and public Git repositories must **never** contain raw API secrets. By keeping `.env.local` only on your server/local machine, your Gemini API quota is protected from theft or unauthorized use.

> [!NOTE]
> **What if you do not have a Gemini API Key?**  
> DocClear is built with a **Dual-Engine Architecture**. If `GEMINI_API_KEY` is left blank, the app will automatically and seamlessly use its **local zero-dependency analytical engine**. It will still parse documents, calculate Flesch-Kincaid reading levels, and extract critical dates and amounts in under 50 milliseconds!

---

## 5. Step 3: Installing Dependencies

Download and install all required node modules:

```bash
npm install
```

This installs:
* Next.js 14, React 18, and ReactDOM.
* Tailwind CSS and Lucide React icons.
* Tesseract.js (for client-side OCR).
* Canvas-confetti and UI animation utilities.

To verify that all TypeScript types and packages are properly resolved without errors, run:
```bash
npx tsc --noEmit
```
*(If this command finishes with no output, your setup is 100% clean and error-free).*

---

## 6. Step 4: Launching the Local Server

Run the development server:

```bash
npm run dev
```

You should see output similar to:
```
  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1500ms
```

Now open your web browser and go to:  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 7. Step 5: Testing Core Application Features

Once the app is running in your browser, test the full document workflow:

### 1. Document Input (`/`)
* **Sample Documents:** Click any of the 4 sample cards (Employment Agreement, Tenancy Agreement, Medical Bill, Council Notice) to test the pipeline with pre-verified legal documents.
* **Camera Scanner:**
  1. Click **"Use camera"**.
  2. If your browser asks for permission, click **"Allow"**.
  3. The responsive camera viewfinder will open. Click the circular **"Snap Page 1"** button (or press `Spacebar` / click on the camera feed).
  4. Snap up to 5 pages. You can rotate pages or delete any blurry pages from the bottom tray.
  5. Click **"Done"**.
* **File Upload:** Click **"Upload Document"** to upload any PDF, Word document (`.docx`), plain text (`.txt`), or image (`.jpg`/`.png`).
* Click **"Simplify Document"** to start OCR extraction.

### 2. OCR Transcription Review (`/review`)
* View the transcribed text extracted by Tesseract OCR.
* Edit or add text directly in the editor to correct any OCR typos.
* Click **"Simplify Document"** to trigger the AI simplification engine.

### 3. Side-by-Side Comparison & Audio (`/comparison`)
* **Original vs. Plain Language:** Compare the source text on the left with the simplified Grade 5–7 explanation on the right.
* **Extracted Deadlines & Amounts:** Review the actionable cards showing candidate due dates, payment sums, and notice periods.
* **Audio Player (Bottom Bar):**
  * Click **Play** to listen to the explanation read aloud via browser speech synthesis.
  * Adjust speed: `0.75x`, `1.0x`, `1.25x`, or `1.5x`.
  * Click or drag the interactive progress bar to scrub to any part of the explanation.
* **Interactive AI Document Agent:**
  * Click the circular blue **Agent Icon** in the bottom-right corner.
  * A slide-up drawer will appear.
  * Ask questions such as *"What is the deadline?"* or *"How much is the penalty?"*.
  * The agent uses grounded document retrieval tools and will answer with exact citations from the scanned clauses.

### 4. Sensor Diagnostics & Evaluation (`/evaluate`)
* Go to **[http://localhost:3000/evaluate](http://localhost:3000/evaluate)**.
* Check the **Device Sensors & Capabilities** panel:
  * Verifies your real hardware model and Android/iOS/Windows version using User-Agent Client Hints.
  * Tilt the phone or laptop to see the live **Pitch & Roll** motion gyro HUD update in real time.
  * Run live checks on Camera, Speech Synthesis, Haptic Motor, and Network status.

---

## 8. Step 6: Running Automated Test Suites

DocClear includes automated unit and contract tests to ensure code quality:

### 1. Document Analysis & Readability Tests:
Run the BFF contract and Flesch-Kincaid test suite:
```bash
node tests/api/analyse.test.js
```
*Expected output:* `ALL AUTOMATED UNIT TESTS PASSED (4/4) ✅`

### 2. AI Document Agent & Tool-Calling Tests:
Run the agent tool-calling and hallucination prevention tests:
```bash
node tests/api/agent.test.js
```
*Expected output:* `ALL AI AGENT TESTS PASSED (4/4) ✅`

---

## 9. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: Terminal says `Error: listen EADDRINUSE: address already in use :::3000`
**Cause:** Another process or previous server instance is already running on port 3000.  
**Fix Option A:** Start on a different port:
```bash
npm run dev -- -p 3001
```
Then visit `http://localhost:3001`.

**Fix Option B (Windows PowerShell):** Kill any lingering Node processes:
```powershell
Get-Process -Name node | Stop-Process -Force
npm run dev
```

---

### Q2: Camera shows black screen or says "Live Camera Not Accessible"
**Cause:** The browser or operating system blocked camera access for `localhost`.  
**Fix:**
1. Look at your browser address bar (next to `localhost:3000`).
2. Click the **Padlock icon 🔒** or **Site Settings** icon.
3. Find **Camera** and switch it from *Block* to **Allow**.
4. Refresh the page (`F5` or `Ctrl+R`).
5. Click **"Use camera"** again.

---

### Q3: Cannot connect to Gitea (`http://192.168.10.10:3000`)
**Cause:** `192.168.10.10` is a local network IP address.  
**Fix:**
* Make sure your computer is connected to the class/campus network or authorized VPN.
* If testing offline, all application code runs completely self-contained without needing an active Gitea connection once cloned.

---

### Q4: Speech audio does not speak on desktop
**Cause:** Browser speech synthesis may require an initial user gesture, or no voices are installed on the OS.  
**Fix:**
1. Ensure your computer sound is unmuted.
2. Click anywhere on the webpage before pressing Play.
3. Open `/evaluate` and click the **"Test Voice"** button on the Speech Audio card to verify playback.

---

### Summary Checklist for Students
1. `git pull origin main` (Get latest code)
2. `cp .env.example .env.local` (Create config file)
3. Insert `GEMINI_API_KEY="..."` in `.env.local`
4. `npm install` (Install libraries)
5. `npm run dev` (Start server)
6. Open `http://localhost:3000` in Google Chrome
