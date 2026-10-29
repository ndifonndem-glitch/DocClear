# DocClear Mobile Deployment & Testing Guide
## Complete Step-by-Step Guide to Publishing DocClear via Ngrok & Testing on a Physical Smartphone

| DOCUMENT METADATA | DETAIL |
| :--- | :--- |
| **Application** | DocClear — Accessible Document Understanding PWA |
| **Course** | IT8530 Advanced Mobile Application Solutions |
| **Target Mobile Device** | Physical Smartphone (Android / iOS) |
| **Tunneling Tool** | Ngrok (Secure HTTPS Tunnel to Localhost) |
| **Local App Port** | Port 3000 (`http://localhost:3000`) |
| **Author** | Jesse Ndem Ndifon |

---

## Table of Contents
1. [Why Ngrok is Required for Mobile Testing](#1-why-ngrok-is-required-for-mobile-testing)
2. [Where to Download Ngrok](#2-where-to-download-ngrok)
3. [One-Time Setup: Connecting Your Ngrok Account](#3-one-time-setup-connecting-your-ngrok-account)
4. [Step-by-Step Commands to Start DocClear & Ngrok](#4-step-by-step-commands-to-start-docclear--ngrok)
5. [How to Open & Use DocClear on Your Smartphone](#5-how-to-open--use-docclear-on-your-smartphone)
6. [Testing the 6 Required Failure Scenarios on Your Phone](#6-testing-the-6-required-failure-scenarios-on-your-phone)
7. [Testing Hardware Sensors & Evaluation at `/evaluate`](#7-testing-hardware-sensors--evaluation-at-evaluate)
8. [Installing DocClear as a PWA on Your Phone](#8-installing-docclear-as-a-pwa-on-your-phone)
9. [Troubleshooting Common Issues](#9-troubleshooting-common-issues)

---

## 1. Why Ngrok is Required for Mobile Testing

Modern mobile web browsers (Google Chrome on Android, Apple Safari on iOS) enforce strict **Secure Context (HTTPS)** policies for device hardware APIs:

* **Camera (`navigator.mediaDevices.getUserMedia`)**: Modern mobile operating systems block camera access completely over plain `http://192.168.x.x:3000`. You cannot capture documents through your phone's camera on an unencrypted HTTP connection.
* **Spatial Motion Sensors (`DeviceOrientationEvent` & `DeviceMotionEvent`)**: Reading phone tilt (Pitch and Roll) requires a secure context.
* **Progressive Web App (PWA) Service Workers**: Service Workers will not register or cache assets over non-localhost HTTP.

> [!IMPORTANT]
> **What Ngrok Does**:
> Ngrok creates a secure, encrypted public HTTPS tunnel (`https://xxxx-xx-xx.ngrok-free.app`) pointing directly to your local development server on port 3000. This provides a genuine, trusted HTTPS certificate that satisfies all mobile browser security requirements.

---

## 2. Where to Download Ngrok

### Option A: Already on Your PC (Fastest)
Ngrok is already present on your machine:
* In your project folder: `.\ngrok.exe`
* In your Downloads folder: `C:\Users\Pc\Downloads\ngrok.exe`

### Option B: Official Website (If downloading on another PC)
1. Go to the official download page: **[https://ngrok.com/download](https://ngrok.com/download)**
2. Click **Download for Windows (64-bit)** to download `ngrok-v3-stable-windows-amd64.zip`.
3. Extract `ngrok.exe` into your project folder.

### Option C: Windows Package Manager (Terminal)
Open PowerShell and run:
```powershell
winget install ngrok.ngrok
```

---

## 3. One-Time Setup: Connecting Your Ngrok Account

Ngrok requires a free auth token to create tunnels.

*(Note: Your PC already has this configured at `C:\Users\Pc\AppData\Local\ngrok\ngrok.yml`! If you need to set it up again or on a new computer, follow these 3 steps:)*

1. Create a free account at: **[https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)**
2. Copy your Auth Token from: **[https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)**
3. In PowerShell, configure your token:
   ```powershell
   .\ngrok.exe config add-authtoken YOUR_PERSONAL_AUTH_TOKEN_HERE
   ```
4. Verify your configuration:
   ```powershell
   .\ngrok.exe config check
   ```
   *Expected output: `Valid configuration file at C:\Users\Pc\AppData\Local\ngrok\ngrok.yml`*

---

## 4. Step-by-Step Commands to Start DocClear & Ngrok

To run the application publicly, you need **two terminal windows** open side-by-side.

### Terminal 1: Start the DocClear Application

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "c:\Users\Pc\Downloads\Edustack lite-20261020\edustack-lite\edustack-lite\docclear"
   ```
2. Start the development server:
   ```powershell
   npm run dev
   ```
3. Keep this terminal running. You should see:
   ```text
   ▲ Next.js 14.2.15
   - Local:        http://localhost:3000
   - Environments: .env.local

   ✓ Ready in 1500ms
   ```

---

### Terminal 2: Start the Ngrok Secure Tunnel

1. Open a **second** PowerShell window in the root project directory:
   ```powershell
   cd "c:\Users\Pc\Downloads\Edustack lite-20261020\edustack-lite\edustack-lite"
   ```
2. Start the HTTPS tunnel pointing to port 3000:
   ```powershell
   .\ngrok.exe http 3000
   ```

   *(Optional: If you have your free static domain claimed in ngrok, such as `arcisa.ngrok-free.dev`, run):*
   ```powershell
   .\ngrok.exe http --domain=arcisa.ngrok-free.dev 3000
   ```

3. Ngrok will start and display a status dashboard:
   ```text
   ngrok                                                           (Ctrl+C to quit)

   Session Status                online
   Account                       Your Name (Plan: Free)
   Version                       3.39.8
   Region                        Asia/Pacific (ap)
   Latency                       45ms
   Web Interface                 http://127.0.0.1:4040
   Forwarding                    https://abc1-23-45.ngrok-free.app -> http://localhost:3000
   ```

4. **Copy the HTTPS URL**: Copy the URL that starts with `https://` (for example, `https://abc1-23-45.ngrok-free.app`).

---

## 5. How to Open & Use DocClear on Your Smartphone

### Step 1: Open the URL on Your Phone
1. Open **Google Chrome** (on Android) or **Safari** (on iPhone).
2. Type or paste the `https://xxxx.ngrok-free.app` URL into the address bar.
3. **The Ngrok Warning Page:** On free ngrok accounts, a blue interstitial screen will appear saying: *"You are about to visit abc1-23-45.ngrok-free.app"*.
   * **Click the blue button: "Visit Site"**.
   * DocClear will immediately load with its full mobile layout!

---

### Step 2: Test the Camera & Multi-Page Scanning
1. On the home screen, tap the large blue **"Take Document Photo"** button.
2. A custom Just-In-Time (JIT) permission card will appear explaining why camera access is required.
3. Tap **"Allow Camera"**.
4. When the mobile browser asks: *"Allow DocClear to access your camera?"*, tap **Allow**.
5. The live camera viewfinder will stream on your screen.
6. **Capture Pages:**
   * Tap the round blue capture button to take Page 1.
   * Tap again for Page 2, Page 3, etc. (up to 5 pages).
   * Notice the thumbnail tray at the bottom tracking: `Page 1 of 3`, `Page 2 of 3`.
   * Tap the rotate button `⟳` to rotate a page 90° if needed.
7. Tap the green **"Process Captured Pages"** button to proceed.

---

### Step 3: Test OCR Review & Manual Correction
1. You will be redirected to `/review`.
2. Tesseract.js (running locally via WebAssembly on your phone) extracts the text.
3. Review the extracted text in the editable textarea.
4. Check the **OCR Confidence Badge** (e.g., `98% Confidence`).
5. Tap inside the text box and edit or add a word to demonstrate manual user control.

---

### Step 4: Test Document Simplification & Split Comparison
1. Tap the blue **"Analyse Document"** button.
2. The server BFF processes the text and returns structured plain English in seconds.
3. **Explore the Comparison Screen (`/comparison`):**
   * **Hero Metric Cards:** See the monthly rent (e.g., `$1,850/mo`), bond deposit (`$3,700`), and payment frequency extracted into dedicated cards.
   * **Dual-Pane View:** On mobile, use the toggle buttons **"Simplified Summary"** vs. **"Original Document"** to compare side-by-side.
   * **Candidate Deadlines:** View upcoming milestones and tap **"Sync to Calendar"** to export an `.ics` event file to your phone calendar.

---

### Step 5: Test Text-to-Speech (Audio Engine)
1. In `/comparison`, tap the blue **Play (▶)** button.
2. Your phone's speaker will read the plain-English summary aloud using the browser's native Web Speech synthesis.
3. Tap **Pause (⏸)**, **Resume**, and change the speech rate (**0.8x**, **1.0x**, **1.2x**) to demonstrate full audio control.

---

### Step 6: Test Document Assistant Q&A
1. Tap the floating chat bubble icon at the bottom right.
2. A slide-up drawer will open.
3. **Ask a supported question:** Type *"How much is the weekly rent?"* -> The assistant quotes Clause 2 and answers `$1,850 per month ($426.92/week)`.
4. **Ask an unsupported question:** Type *"Can I have a pet dog?"* -> The assistant accurately replies with negative grounding: *"The uploaded document does not contain any pet policy or animal restrictions."*

---

## 6. Testing the 6 Required Failure Scenarios on Your Phone

The examiner will ask you to demonstrate how the app handles network errors, provider outages, and low AI confidence. You can trigger every single scenario directly on your phone by appending `?fail=...` to the review URL:

| Failure Mode | Test URL to Open on Phone | What Happens & How App Recovers |
| :--- | :--- | :--- |
| **1. Rate Limited (HTTP 429)** | `https://xxxx.ngrok-free.app/review?fail=busy` | The server returns HTTP 429. An amber banner appears stating *"The agent is busy. Rate limited (429)"*. A **Retry** button lets the user try again without losing their text. |
| **2. Upstream Outage (HTTP 503)** | `https://xxxx.ngrok-free.app/review?fail=error` | The server returns HTTP 503. The app notifies the user that the cloud service is down and offers the **"Use Local Fallback"** engine (runs in 42ms offline). |
| **3. Malformed JSON (HTTP 502 HTML)** | `https://xxxx.ngrok-free.app/review?fail=malformed` | Simulates an upstream proxy returning raw HTML instead of JSON. The app catches the parsing error, displays a graceful error alert, and prevents any application crash. |
| **4. Slow Network Delay (4s)** | `https://xxxx.ngrok-free.app/review?fail=slow` | Introduces a 4-second delay. Demonstrates progress bar animation and loading indicators. |
| **5. Network Timeout (65s) & Abort** | `https://xxxx.ngrok-free.app/review?fail=timeout` | The server holds the connection for 65 seconds. After 5 seconds, a helper warning appears. Tap the **"Cancel"** button to abort the request immediately via `AbortController`. |
| **6. Low Confidence (< 0.70)** | `https://xxxx.ngrok-free.app/review?fail=low` | Simulates an ambiguous document where confidence is 0.42. The comparison screen displays an amber alert: **"⚠️ Status: Needs Review — Low Confidence (42%)"** instructing manual human verification. |

---

## 7. Testing Hardware Sensors & Evaluation at `/evaluate`

Navigate to: `https://xxxx.ngrok-free.app/evaluate` on your smartphone.

### 1. Real-Time Spatial Motion Telemetry
* Scroll to the **Physical Mobile Sensor Diagnostics** card.
* Physically hold your phone in your hand and tilt it forward, backward, left, and right.
* Watch the live meters update:
  * **Pitch (°)**: Front-to-back tilt (e.g., `35°`).
  * **Roll (°)**: Side-to-side tilt (e.g., `-3°`).
  * **Secure Context**: Displays `HTTPS Active (Secure)`.
  * **Active Cameras**: Lists front and back optical lenses enumerated via `MediaDevices`.

### 2. Interactive System Usability Scale (SUS) Calculator
* Rate the 10 standardized usability statements on a 1-to-5 scale.
* The tool calculates the exact score in real time using John Brooke's (1996) formula:
  $$\text{Adjusted Sum} = \sum(\text{Odd} - 1) + \sum(5 - \text{Even})$$
  $$\text{SUS Score} = \text{Adjusted Sum} \times 2.5$$
* Tap **"Copy Breakdown"** to copy the results to your clipboard, or **"Download Report"** to save `DocClear_SUS_Evaluation.txt`.

### 3. Nielsen-Molich Heuristic Audit
* View the 10 mobile heuristic compliance checks (Visibility of Status, Error Prevention, Aesthetic Design, etc.) with all 10 marked **PASS**.

---

## 8. Installing DocClear as a PWA on Your Phone

DocClear includes a fully configured Web App Manifest and Service Worker:

### On Android (Google Chrome):
1. While on `https://xxxx.ngrok-free.app`, tap the **three dots menu (⋮)** in the top right corner.
2. Select **"Add to Home screen"** or **"Install app"**.
3. Tap **Install**.
4. The DocClear icon will appear on your phone's home screen alongside native apps.
5. Tap the icon to launch DocClear in **standalone full-screen mode** (no browser URL bar).

### On iOS (Apple Safari):
1. In Safari, tap the **Share button (rectangle with arrow pointing up)** at the bottom.
2. Scroll down and tap **"Add to Home Screen"**.
3. Tap **Add**.
4. Launch DocClear from your iOS home screen as a standalone app.

---

## 9. Troubleshooting Common Issues

### Issue 1: "Port 3000 is already in use"
* **Cause**: Another node process is already running on port 3000.
* **Fix**: In PowerShell, kill the existing process:
  ```powershell
  Stop-Process -Name node -Force
  ```
  Then restart `npm run dev` in the `docclear` folder.

### Issue 2: "Camera access denied / permission prompt doesn't show"
* **Cause**: Camera permission was previously blocked in the mobile browser.
* **Fix**:
  1. In your phone's browser, tap the **padlock / tune icon** to the left of the URL.
  2. Tap **Permissions** -> **Camera** -> Select **Allow** (or tap **Reset permissions**).
  3. Refresh the page.

### Issue 3: "Ngrok session expired or connection refused"
* **Cause**: Your laptop went to sleep or the ngrok terminal was closed.
* **Fix**:
  1. Ensure your laptop remains awake.
  2. Restart ngrok in PowerShell:
     ```powershell
     .\ngrok.exe http 3000
     ```
  3. Update the URL in your phone's browser with the new HTTPS forwarding link.

### Issue 4: "Bypassing the Ngrok Free warning banner automatically"
* If you are calling the DocClear API programmatically or via curl from a script, add this custom HTTP header to skip the ngrok interstitial page:
  ```text
  ngrok-skip-browser-warning: true
  ```
  Example curl command:
  ```bash
  curl -H "ngrok-skip-browser-warning: true" https://xxxx.ngrok-free.app/api/health
  ```

---

## Quick Reference Command Summary

```powershell
# 1. Start App Server (Terminal 1)
cd docclear
npm run dev

# 2. Start Public HTTPS Tunnel (Terminal 2)
.\ngrok.exe http 3000

# 3. Optional: Start Course EduStack BFF (Terminal 3)
python services/bff.py
```
*(Now open the generated `https://xxxx.ngrok-free.app` URL on your smartphone!)*
