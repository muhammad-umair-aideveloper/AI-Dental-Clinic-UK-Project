# Vertex Dental Lab — UK GDPR & Clinical Health Data Compliance Guide

This guide details the mandatory regulatory compliance architecture implemented for **Vertex Dental Lab** (London, UK), covering the **UK General Data Protection Regulation (UK GDPR)**, the **Data Protection Act 2018 (DPA 2018)**, and the **General Dental Council (GDC)** ethical and clinical record-keeping standards.

---

## 1. Information Commissioner's Office (ICO) Registration Checklist

Under the Data Protection (Charges and Information) Regulations 2018, every healthcare organisation and dental practice processing personal data must pay an annual data protection fee to the **Information Commissioner's Office (ICO)** unless fully exempt. Dental practices providing private or NHS care are **not exempt**.

- [ ] **ICO Tier Assessment:** Most independent private dental clinics fall under **Tier 1** (micro-organisations: turnover ≤ £632,000 or ≤ 10 staff) or **Tier 2** (small/medium organisations).
- [ ] **Registration Reference:** Obtain and store the clinic's **ICO Registration Number** (format: `ZAxxxxxx`).
- [ ] **Data Protection Officer (DPO) / Lead:** Nominate a Data Protection Lead (typically the Practice Manager or Lead Clinician, Dr. Alistair Vance).
- [ ] **Annual Renewal:** Calendar annual reminder for ICO registration renewal.

---

## 2. Cloud Infrastructure & UK Data Sovereignty

### Supabase Database Region
- **Requirement:** Under UK GDPR Article 44–46, transfer of personal and Special Category Health Data outside the UK/EEA requires an Adequacy Decision or Standard Contractual Clauses (SCCs).
- **Configuration:** When provisioning the production Supabase project:
  - **Selected Region:** `eu-west-2` (**London, United Kingdom**) or `eu-west-1` (**Dublin, Ireland / EEA**).
  - **Encryption at Rest:** PostgreSQL uses AES-256 transparent database encryption.
  - **Encryption in Transit:** Strict TLS 1.3 encryption across all API, webhook, and dashboard traffic.

---

## 3. Mandatory Data Processing Agreements (DPAs)

The clinic must maintain signed Data Processing Agreements with all third-party sub-processors:

| Sub-Processor | Service Purpose | Data Processed | DPA Location / Execution |
| :--- | :--- | :--- | :--- |
| **Supabase Inc.** | PostgreSQL hosting, Auth, pg_cron | Patient records, diary dates, phone numbers | [Supabase DPA](https://supabase.com/legal/dpa) |
| **Twilio Inc.** | UK SMS messaging (appointment reminders) | E.164 phone number (+447...), short reminder text | [Twilio Data Protection Addendum](https://www.twilio.com/legal/data-protection-addendum) |
| **Resend Inc.** | Transactional owner reports & email alerts | Owner email, appointment diary summary | [Resend DPA](https://resend.com/legal/dpa) |
| **Google Cloud / LLM** | Natural language triage & FAQ response | Non-PII symptom queries, scrubbed text only | [Google Cloud DPA / Model Terms](https://cloud.google.com/terms/data-processing-addendum) |

> **Critical Rule:** The clinic has zero-data-retention agreements for AI models: prompts and completions are NOT used to train foundation models.

---

## 4. Lawful Grounds for Processing (UK GDPR Articles 6 & 9)

Dental data represents **Special Category Data** (Article 9: Health Data). Processing requires two distinct legal bases:

1. **Standard Personal Data (Article 6):**
   - **Article 6(1)(b) - Contract:** Necessary to book appointments, record patient requests, and reserve clinical time with Dr. Vance.
   - **Article 6(1)(a) - Consent:** Explicit opt-in consent for automated 1-hour SMS reminders (`reminder_consent = TRUE` with timestamp).
2. **Special Category Health Data (Article 9):**
   - **Article 9(2)(h) - Health & Social Care Provision:** Processing necessary for preventative or diagnostic healthcare provision by registered dental professionals bound by professional secrecy (GDC Standards for the Dental Team).

---

## 5. Automated Reminder Consent Architecture

- **Granular Consent:** Patient reminder consent is completely unbundled from booking. A patient may book an appointment while declining automated reminders.
- **Timestamped Audit Trail:** Every consent event stores `reminder_consent` (boolean) and `consent_timestamp` (`TIMESTAMPTZ` in UTC).
- **Instant Opt-Out:** Patients can request removal from reminders at any time. Receptionists can toggle `reminder_consent = FALSE` in the admin dashboard.

---

## 6. Zero-PII AI Chatbot Guardrails

The chatbot is strictly hardened against patient health data leaks:
1. **Length Limitation:** Payloads capped at 1,000 characters to prevent buffer and token abuse.
2. **Regex PII Scrubber:**
   - Redacts UK NHS Numbers (10-digit formats).
   - Redacts UK National Insurance Numbers.
   - Redacts 16-digit payment card numbers.
3. **No Direct Tool/Database Execution by LLM:** The LLM cannot directly read the `appointments` or `patients` tables. All bookings flow through the authoritative `createAppointment` service.

---

## 7. Subject Access Requests (SAR) & Data Retention

- **Statutory SAR Response Window:** 1 calendar month (30 calendar days).
- **GDC Clinical Record Retention:**
  - Adult patient records: Minimum of **11 years** after the completion of treatment.
  - Children's records: Until the patient reaches age 25, or 11 years after treatment completion, whichever is longer.
- **Operational Reminder Logs:** Stored in `daily_reports_log` and `appointments` with operational logs archived after 30 days.
