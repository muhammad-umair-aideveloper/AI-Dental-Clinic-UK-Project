# Reception User Guide — Vertex Dental Lab Revenue Automation

**One page. Plain English. Everything you need to know.**

---

## What Does the System Do?

When a patient contacts the clinic via the website chat, WhatsApp, or contact form, the system automatically:

1. **Checks for emergencies** immediately (before anything else)
2. **Qualifies the lead** — finds out what treatment they want, when they want it, and collects their contact details
3. **Sends a deposit link** via WhatsApp/SMS so they can secure their slot
4. **Books a calendar hold** while they pay
5. **Sends appointment reminders** at 24h and 2h before their slot
6. **Asks for a Google review** after their appointment is marked complete

You don't need to do anything for steps 1–5 unless something goes wrong. The system handles it automatically.

---

## The Admin Dashboard

Go to: **[your-website.co.uk/revenue-admin](https://vertexdental.co.uk/revenue-admin)**

Sign in with your Google account (only allow-listed staff emails work).

### What you'll see:

| Column | What it means |
|---|---|
| 🚨 EMERGENCY | Patient contacted us with a dental emergency |
| 🔴 HOT | Patient wants to start *immediately* — call first |
| 🟡 WARM | Within 3 months timeline |
| 🔵 COLD | Just researching |

### Marking appointment outcomes:

After a patient's appointment, click the appropriate button:

| Button | When to click |
|---|---|
| **✅ Attended** | Patient came in. The deposit will be credited toward their treatment. |
| **⭐ Completed** | Treatment done. A review request will be sent automatically in 2 hours. |
| **❌ No-show** | Patient didn't arrive. Deposit is retained per our T&Cs. |
| **Cancel** | Appointment cancelled by either party. |

> **Important:** Click "Completed" (not just "Attended") to trigger the review request.

---

## Emergency Patients 🚨

If the system detects a dental emergency from a patient's message:
- It immediately sends the patient our emergency contact number and NHS 111 details
- It sends you an **urgent alert** via WhatsApp + email with the patient's details
- It says **"Offer first 08:30 slot"** — please act on this as soon as the clinic opens

**If the emergency arrives out of hours:**
The system will send you a reminder at **08:15 the next morning** with the patient's details.

**You do not need to respond to the automated chat.** Just call the patient when you see the alert.

---

## Deposit Links

The system automatically sends a payment link after a lead is qualified. The patient has **24 hours** to pay before the calendar hold is released.

- **If they pay:** slot is confirmed, patient gets confirmation message automatically
- **If they don't pay in 24h:** you'll get an email notification; the slot is freed
- **If they need a new link:** go to Admin Dashboard → find the lead → system will generate a new one (contact IT if this isn't yet available in the UI)

---

## Appointment Reminders

The system sends automatic reminders:
- **24 hours before** the appointment: date, time, address, parking, Google Maps link, reschedule link
- **2 hours before**: date, time, address, Google Maps link

You don't need to send these manually.

**Quiet hours rule:** No messages are sent to patients between **9:00 PM and 8:00 AM**, except for emergency replies and payment confirmations.

---

## Review Requests

After you mark an appointment as **Completed**, the system automatically sends the patient a Google review request **2 hours later** (or at 9:00 AM the next day if it's after 8:00 PM).

It sends a maximum of **2 messages** per patient. It respects STOP/opt-out requests immediately.

**Do not manually ask for reviews** — let the system handle it to avoid double-messaging.

---

## Cancellations & Refunds

| Scenario | What happens |
|---|---|
| Patient cancels **≥24h before** appointment | Full refund of deposit (you need to process this in Stripe) |
| Patient cancels **<24h before** | Deposit kept per T&Cs |
| Patient no-shows | Deposit kept per T&Cs |
| Patient attends | Deposit credited toward treatment cost |

The patient's cancellation/reschedule link is included in their confirmation message.

---

## GDPR / Patient Data

**If a patient asks to have their data deleted:**
1. Go to Admin Dashboard → find the lead
2. Click the 🗑 (delete) icon
3. This removes all personal information from the system
4. Confirm to the patient: "Your data has been removed from our systems."

**If a patient asks for a copy of their data (Subject Access Request):**
1. Go to Admin Dashboard → find the lead
2. Click the ↓ (export) icon
3. A JSON file will download — forward this to the patient

---

## What to Do If Something Goes Wrong

| Problem | Action |
|---|---|
| Patient says they didn't get a confirmation | Check their mobile number in the dashboard; resend manually via WhatsApp |
| Deposit link expired | Contact IT — new link needs to be generated |
| Patient got the wrong info from the chat | Note what the chat said and report to IT — the FAQ answers should be updated |
| Chat sent an incorrect price | **This should not happen** — report immediately. The chat is only allowed to use pre-approved FAQ answers |
| Emergency alert received | Call the patient. Don't rely on the chat having collected all their details |
| System down | Fall back to manual WhatsApp: **+44 20 7946 0888** |

---

## Daily Summary Email

At 8:00 PM on weekdays, you'll receive a daily summary email with:
- New leads (HOT/WARM/COLD counts)
- Emergency contacts
- Deposit conversion rate
- No-show rate
- Reviews requested

Check this email each morning to track clinic performance.

---

## Key Contacts

| Need | Contact |
|---|---|
| System technical issue | IT support (contact set up during onboarding) |
| Change FAQ answers | IT — update `clinic.config.ts` |
| Change deposit amount | IT — update `clinic.config.ts` |
| Update emergency message text | Dr. Alistair Vance must approve, then IT |
| Add new staff email to admin access | IT — update `clinic.config.ts` |

---

*This guide covers the automated system only. For clinical and operational procedures, refer to the Clinic Operations Manual.*
