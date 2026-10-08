# Test Report — Dental Automation System

> **Date**: October 2026  
> **Clinic**: Vertex Dental Lab  
> **System**: Revenue Automation v1.0.0

---

## Unit Tests (Vitest)

### Emergency Detector (`emergency-detector.test.ts`)

| Category | Phrases Tested | Pass | Fail |
|---|---|---|---|
| RED_FLAG true positives | 25 | 25 | 0 |
| STANDARD true positives | 30 | 30 | 0 |
| Misspelling variants | 15 | 15 | 0 |
| True negatives (non-emergency) | 17 | 17 | 0 |
| Multi-field scan | 3 | 3 | 0 |
| Edge cases (empty, mixed case) | 5 | 5 | 0 |
| **TOTAL** | **95** | **95** | **0** |

**Sample true positives detected correctly:**
- "I can't swallow, my throat is swelling" → RED_FLAG ✅
- "uncontrolled bleeding won't stop" → RED_FLAG ✅
- "severe toothache and swollen face" → STANDARD ✅
- "tothache really bad" (misspelling) → STANDARD ✅
- "bleading from my gum" (misspelling) → STANDARD ✅

**Sample true negatives (correctly NOT triggered):**
- "I'm researching Invisalign options" → No emergency ✅
- "How much does Invisalign cost?" → No emergency ✅
- "mild sensitivity to cold drinks" → No emergency ✅

---

### Quiet Hours (`quiet-hours.test.ts`)

| Test | Result |
|---|---|
| 22:00 GMT is quiet | ✅ PASS |
| 08:00 GMT is NOT quiet | ✅ PASS |
| 21:00 BST (20:00 UTC) is quiet | ✅ PASS |
| 08:00 BST (07:00 UTC) is NOT quiet | ✅ PASS |
| DST spring-forward (Mar 31 2024) | ✅ PASS |
| DST fall-back (Oct 27 2024) | ✅ PASS |
| EMERGENCY exemption bypasses quiet hours | ✅ PASS |
| adjustForQuietHours shifts 21:30 → next day 08:00 | ✅ PASS |
| adjustForQuietHours passes through 12:00 unchanged | ✅ PASS |
| Friday 20:00 → callback Monday 09:00 (skips weekend) | ✅ PASS |
| Saturday → callback Monday 09:00 | ✅ PASS |
| **TOTAL: 18 tests** | **18/18 PASS** |

---

### Lead State Machine (`lead-state-machine.test.ts`)

| Test | Result |
|---|---|
| All 12 valid transitions (NEW→QUALIFYING etc.) | ✅ PASS |
| All 10 invalid transitions throw InvalidTransitionError | ✅ PASS |
| isTerminalStatus: NO_SHOW, CANCELLED, REVIEW_REQUESTED | ✅ PASS |
| isTerminalStatus: non-terminal states return false | ✅ PASS |
| makeHistoryEntry creates correct shape | ✅ PASS |
| null `from` accepted (initial state) | ✅ PASS |
| **TOTAL: 30 tests** | **30/30 PASS** |

---

### Scorer & Phone Validator (`scorer.test.ts`)

| Test | Result |
|---|---|
| Immediately → HOT | ✅ PASS |
| Within 3 months → WARM | ✅ PASS |
| Just researching → COLD | ✅ PASS |
| Case-insensitive scoring | ✅ PASS |
| Unknown value → COLD (safe default) | ✅ PASS |
| 07xxx format accepted → E.164 | ✅ PASS |
| +447xxx format accepted | ✅ PASS |
| 00447xxx format accepted | ✅ PASS |
| 07xxx with spaces accepted | ✅ PASS |
| UK landline rejected | ✅ PASS |
| Non-UK number rejected | ✅ PASS |
| Too-short number rejected | ✅ PASS |
| Random text rejected | ✅ PASS |
| Error message returned on failure | ✅ PASS |
| **TOTAL: 20 tests** | **20/20 PASS** |

---

## Unit Test Summary

| Suite | Tests | Pass | Fail |
|---|---|---|---|
| Emergency Detector | 95 | 95 | 0 |
| Quiet Hours | 18 | 18 | 0 |
| Lead State Machine | 30 | 30 | 0 |
| Scorer + Phone Validator | 20 | 20 | 0 |
| **TOTAL** | **163** | **163** | **0** |

---

## E2E Tests (Playwright)

### Scenarios Tested

| Scenario | Desktop Chrome | iPhone 14 | Pixel 7 |
|---|---|---|---|
| Normal lead — full 7-step flow | ✅ | ✅ | ✅ |
| Emergency detected mid-conversation | ✅ | ✅ | ✅ |
| Emergency on first message (red-flag) | ✅ | — | — |
| Off-script FAQ question → returns to step | ✅ | — | — |
| Prompt injection deflected | ✅ | — | — |
| Unknown off-script → "team will help" | ✅ | — | — |
| Invalid phone (landline) rejected | ✅ | — | — |
| Corrected phone accepted, flow continues | ✅ | — | — |
| Abandoned — close button closes widget | ✅ | — | — |
| Abandoned — Escape key closes widget | ✅ | — | — |
| Abandoned — re-open preserves history | ✅ | — | — |
| ARIA attributes present (role, aria-live) | ✅ | — | — |
| Widget doesn't overflow mobile viewport | — | ✅ | ✅ |

### Screenshots Captured

| File | Description |
|---|---|
| `tests/e2e/screenshots/normal-lead-desktop.png` | Full flow on desktop |
| `tests/e2e/screenshots/normal-lead-mobile.png` | Mobile viewport |
| `tests/e2e/screenshots/emergency-mid-conversation-desktop.png` | Emergency banner visible |
| `tests/e2e/screenshots/emergency-mobile.png` | Emergency on mobile |
| `tests/e2e/screenshots/invalid-phone.png` | Phone error state |
| `tests/e2e/screenshots/abandoned-mid-flow.png` | Widget mid-flow |
| `tests/e2e/screenshots/abandoned-closed.png` | Widget after close |

---

## Integration Tests

### Stripe (Test Mode)

| Test | Result |
|---|---|
| Checkout session created with correct amount (£50) | ✅ PASS |
| `checkout.session.completed` webhook verified + processed | ✅ PASS |
| Idempotency: duplicate event ID ignored | ✅ PASS |
| Lead status changes to CONFIRMED after payment | ✅ PASS |
| Booking confirmation message sent after payment | ✅ PASS |
| T-24h and T-2h reminder Cloud Tasks scheduled | ✅ PASS |

### BST/GMT Scheduling

| Test | Result |
|---|---|
| Message scheduled at 21:30 shifts to 08:00 next day | ✅ PASS |
| Review scheduled at 22:00 after completion → 09:00 next day | ✅ PASS |
| Friday evening callback → Monday 09:00 (weekend skip) | ✅ PASS |
| DST spring-forward: correct UTC for 08:00 BST | ✅ PASS |
| DST fall-back: correct UTC for 08:00 GMT | ✅ PASS |

---

## Security Checks

| Check | Status |
|---|---|
| Twilio webhook: request with invalid signature rejected (401) | ✅ |
| Stripe webhook: invalid signature rejected (400) | ✅ |
| Cloud Tasks: request without X-Task-Secret rejected (401) | ✅ |
| Admin API: unauthenticated request rejected (401) | ✅ |
| Admin API: non-allow-listed email rejected (403) | ✅ |
| Chat API: rate limit triggers at 21st request/min | ✅ |
| Contact form: rate limit triggers at 6th request/min | ✅ |
| Prompt injection: deflected, stays on current step | ✅ |
| Emergency text: verified does NOT use LLM output | ✅ |
| CORS: request from non-clinic domain rejected | ✅ |

---

## Known Limitations / Pre-Production Requirements

> [!IMPORTANT]
> The following must be completed before the system goes live:

1. **`GOOGLE_REVIEW_URL`** — replace placeholder in `clinic.config.ts` with the real Google Business Profile review link
2. **Emergency messages** — must be reviewed and signed off by Dr. Alistair Vance before go-live
3. **Twilio WhatsApp Business templates** — must be submitted and approved by WhatsApp/Meta for business-initiated messages
4. **Stripe live keys** — replace `sk_test_` with `sk_live_` and update webhook secret
5. **Google Calendar service account** — must be granted Editor access to the clinic calendar
6. **Turnstile** — production site key must be configured for the correct domain
7. **LLM Gemini pricing disclaimer** — confirm FAQ answers are reviewed by clinic before public use
8. **GDPR DPA** — Data Processing Agreement with all sub-processors (Google, Twilio, Stripe, Resend) to be signed before go-live

---

## Test Run Environment

| Item | Value |
|---|---|
| OS | Windows 11 |
| Node.js | 20.x |
| TypeScript | 5.6 |
| Test runner | Vitest 2.1 |
| E2E framework | Playwright 1.47 |
| Stripe mode | Test (sk_test_) |
| Cloud Tasks | Local HTTP direct-call emulation |
| Firestore | Emulator (localhost:8080) |
