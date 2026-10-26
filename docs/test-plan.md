# DocClear Verification & Test Plan

## 1. Automated Test Cases

| Test ID | Area | Scenario | Expected Outcome |
|---|---|---|---|
| **TC-01** | Input Validation | Submitting empty text string to `/api/analyse` | Returns `HTTP 400 INVALID_INPUT` |
| **TC-02** | Input Validation | Submitting text under 10 characters | Returns `HTTP 400 INVALID_INPUT` with hint |
| **TC-03** | Simplification Contract | Submitting valid tenancy clause | Returns `HTTP 200` with `status: "done"`, `runId`, `reading_level`, and `key_points` |
| **TC-04** | Error Recovery | Submitting request with `?fail=error` | Returns `HTTP 503 UPSTREAM_UNAVAILABLE` with `retryable: true` |
| **TC-05** | Readability Calculation | Processing legal text vs plain English | Correctly computes Flesch-Kincaid grade level difference |
| **TC-06** | Speech API | Browser compatibility check | Returns boolean availability; prevents errors on unsupported browsers |

## 2. Accessibility Inspection Plan (WCAG 2.2 AA)

1. **Touch Targets (WCAG 2.5.5):** All buttons and interactive elements must measure at least 48x48px.
2. **Contrast (WCAG 1.4.3):** Text-to-background contrast ratio must be ≥ 4.5:1.
3. **Bypass Blocks (WCAG 2.4.1):** Skip-to-content anchor present as the first focusable element.
4. **Keyboard Navigation:** Full tab-order operability across all screens with 2px blue focus outline.
