# DocClear Requirements Traceability Matrix

**Course:** IT8530 Advanced Mobile Application Solutions  
**Framework:** Next.js (App Router) + TypeScript + Tailwind CSS (PWA)

## Functional Requirements Status

| ID | Requirement | Priority | Implementation Component | Status |
|---|---|---|---|---|
| **FR-01** | Capture document image using device camera | Must | `components/capture/CameraCapture.tsx` | Implemented |
| **FR-02** | Select existing document image from device storage | Must | `components/capture/CameraCapture.tsx` | Implemented |
| **FR-03** | Explain permissions and maintain privacy | Must | `components/ui/Alert.tsx`, Privacy Banner | Implemented |
| **FR-04** | Client-side OCR text extraction | Must | `lib/ocr.ts` (Tesseract.js) | Implemented |
| **FR-05** | Inspect & correct extracted text before simplification | Must | `app/review/page.tsx`, `TextReviewEditor.tsx` | Implemented |
| **FR-06** | Submit text to orchestration layer via approved BFF | Must | `app/api/analyse/route.ts`, `services/simplification.ts` | Implemented |
| **FR-07** | Display returned simplified text & preserve original access | Must | `app/comparison/page.tsx`, `ComparisonView.tsx` | Implemented |
| **FR-08** | Switch between / compare original and simplified versions | Must | Side-by-side split & Tabbed toggle in `ComparisonView.tsx` | Implemented |
| **FR-09** | Play, pause, and replay text-to-speech with speed controls | Must | `components/audio/SpeechPlayer.tsx` (Web Speech API) | Implemented |
| **FR-10** | Display loading, empty, success, and error recovery states | Must | `components/ui/Alert.tsx`, `app/api/analyse/route.ts` | Implemented |
| **FR-11** | Warn users to verify details against original document | Must | `components/comparison/DisclaimerBanner.tsx` | Implemented |
| **FR-12** | Readable text, clear navigation, WCAG 2.2 AA accessibility | Must | `app/layout.tsx` (Skip link, 48px touch targets) | Implemented |
| **FR-13** | Show reading-level estimate and improvement metrics | Should | `lib/readability.ts` (Flesch-Kincaid formula) | Implemented |
| **FR-14** | Translation extension point | Could | Planned extension in `app/api/analyse/route.ts` | Documented |
| **FR-15** | Clear current document session and displayed results | Must | `handleClearSession` in `app/comparison/page.tsx` | Implemented |
