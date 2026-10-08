# Vertex Dental Lab — Revenue Automation System

## System Overview

This service adds a fully automated **Clinic Revenue Automation** pipeline to the Vertex Dental Lab website. It runs as a separate Fastify microservice deployed to Google Cloud Run, connected to the existing Next.js website via an embeddable chat widget.

```
Website (Next.js 16)          Automation Service (Fastify)
     |                               |
     |── /widget.js ────────────────►|── Chat API
     |── /revenue-admin ────────────►|── Admin API (Google OAuth)
     |── Contact Form ──────────────►|── Contact Form API
                                     |── Twilio Webhooks
                                     |── Stripe Webhooks
                                     |── Cloud Tasks Jobs
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 10+ | Included with Node 20 |
| Docker | 24+ | For local container testing |
| gcloud CLI | Latest | `gcloud --version` |
| Terraform | 1.6+ | For infrastructure provisioning |
| Stripe CLI | Latest | For local webhook testing |

---

## Step-by-Step Setup

### 1. Clone & Install

```bash
# Root (Next.js website)
cd "C:\Dental Website"
npm install

# Automation service
cd automation
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 2. Create Environment File

```bash
# From the repo root
cp .env.example automation/.env
```

Open `automation/.env` and fill in **every** value. See comments in `.env.example` for guidance.

> **Never commit `.env` to git.** It's in `.gitignore`.

### 3. Configure clinic.config.ts

Open [`automation/src/clinic.config.ts`](automation/src/clinic.config.ts) and verify:
- `name`, `leadDentist`, `timezone` are correct
- `contact.whatsapp`, `contact.emergencyLine` are real numbers
- `googleReviewUrl` is the real Google review URL
- `admin.allowedEmails` contains the correct staff emails
- Emergency messages have been reviewed and approved by Dr. Alistair Vance

### 4. Set Up GCP Project

```bash
# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudtasks.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  calendar-json.googleapis.com
```

### 5. Provision Infrastructure (Terraform)

```bash
cd infra/terraform

# Initialise
terraform init

# Preview
terraform plan \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="service_url=https://PLACEHOLDER.a.run.app" \
  -var="image=placeholder"

# Apply (creates queues, Firestore, secrets, IAM)
terraform apply \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="service_url=https://PLACEHOLDER.a.run.app" \
  -var="image=placeholder"
```

> The service URL and image are only needed for Cloud Scheduler and can be updated after first deploy.

### 6. Add Secrets to Secret Manager

For each secret in `.env.example`, add its value:

```bash
# Example
echo -n "your-actual-value" | \
  gcloud secrets versions add TWILIO_AUTH_TOKEN --data-file=-
```

Or use the Google Cloud Console → Secret Manager.

### 7. Set Up Google Calendar Service Account

1. In GCP Console → IAM → Service Accounts, find `dental-automation-run@PROJECT.iam.gserviceaccount.com`
2. Create a key: Actions → Manage Keys → Add Key → JSON
3. Add the JSON to Secret Manager as `GOOGLE_CALENDAR_SA_KEY`
4. Share your clinic's Google Calendar with the service account email (give it **Editor** access)

### 8. Configure Twilio

1. Get a WhatsApp-enabled number from Twilio Console
2. Set the webhook URL for inbound messages: `https://YOUR_SERVICE/webhooks/twilio/whatsapp`
3. Set the same for SMS: `https://YOUR_SERVICE/webhooks/twilio/sms`
4. Enable the Twilio WhatsApp Business template for business-initiated messages

### 9. Configure Stripe

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Listen for webhooks (local development)
stripe listen --forward-to localhost:8080/webhooks/stripe

# Copy the webhook secret shown and add to .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Register a production webhook at: `https://YOUR_SERVICE/webhooks/stripe`
Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`

### 10. Set Up Cloudflare Turnstile

1. Go to Cloudflare Dashboard → Turnstile → Add Site
2. Add your domain `vertexdental.co.uk`
3. Copy Site Key → add to widget `data-site-key` attribute
4. Copy Secret Key → `TURNSTILE_SECRET_KEY` in Secret Manager
5. For local dev use test keys: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`

### 11. Embed the Widget on the Website

Add to `src/app/layout.tsx` before `</body>`:

```html
<script
  src="https://YOUR_AUTOMATION_SERVICE/widget.js"
  data-api="https://YOUR_AUTOMATION_SERVICE"
  data-site-key="YOUR_TURNSTILE_SITE_KEY"
  data-clinic="Vertex Dental Lab"
  defer
></script>
```

Also add to the existing `<LocationAndContact>` component:

```tsx
<ContactForm apiUrl="https://YOUR_AUTOMATION_SERVICE/api/contact-form" />
```

### 12. Run Unit Tests

```bash
cd automation
npm test
```

Expected output: **All 80+ test cases pass** including:
- Emergency detector (≥50 phrases)
- Quiet hours / BST/GMT boundaries
- Lead state machine transitions
- Scorer and phone validator

### 13. Run E2E Tests (Playwright)

```bash
# Start the automation service
npm run dev

# In another terminal, start the Next.js site
cd ..
npm run dev

# Run E2E tests
cd automation
npm run test:e2e
```

Screenshots are saved to `automation/tests/e2e/screenshots/`.

---

## Running Locally (Development)

```bash
# Terminal 1: Start automation service
cd automation
npm run dev
# → Starts on http://localhost:8080

# Terminal 2: Start Next.js website
cd "C:\Dental Website"
npm run dev
# → Starts on http://localhost:3000
```

Verify: `curl http://localhost:8080/health` → `{"status":"ok"}`

---

## Deploying to Cloud Run

```bash
# From repo root
GCP_PROJECT_ID=your-project-id ./infra/deploy.sh
```

The script:
1. Builds the Docker image
2. Pushes to Artifact Registry
3. Deploys to Cloud Run (europe-west2)
4. Runs health check
5. Migrates traffic only if health check passes

> ⚠️ **Do NOT deploy with live credentials until all tests pass.**

---

## Key Files

| File | Purpose |
|---|---|
| [`automation/src/clinic.config.ts`](automation/src/clinic.config.ts) | **All** clinic-specific values |
| [`automation/src/core/lead-state-machine.ts`](automation/src/core/lead-state-machine.ts) | Lead state enforcement |
| [`automation/src/workflows/w2-emergency/detector.ts`](automation/src/workflows/w2-emergency/detector.ts) | Emergency keyword detector |
| [`automation/src/workflows/w1-qualifier/handler.ts`](automation/src/workflows/w1-qualifier/handler.ts) | Chat conversation handler |
| [`automation/src/workflows/w3-deposit/stripe.ts`](automation/src/workflows/w3-deposit/stripe.ts) | Stripe Checkout + webhooks |
| [`automation/src/workflows/w4-review/scheduler.ts`](automation/src/workflows/w4-review/scheduler.ts) | Review request scheduling |
| [`automation/widget/src/widget.ts`](automation/widget/src/widget.ts) | Embeddable chat widget |
| [`src/app/revenue-admin/page.tsx`](src/app/revenue-admin/page.tsx) | Staff admin dashboard |
| [`infra/terraform/main.tf`](infra/terraform/main.tf) | Cloud infrastructure |
| [`infra/deploy.sh`](infra/deploy.sh) | Cloud Run deploy script |
| [`.env.example`](.env.example) | All environment variables |

---

## Architecture Diagram

```
Patient
  │
  ▼
Chat Widget / Contact Form / WhatsApp / SMS
  │
  ▼
[W2: Emergency Detector — ALWAYS FIRST, synchronous regex]
  │
  ├── Emergency detected → Fixed pre-approved text → Alert reception
  │
  └── No emergency → [W1: Lead Qualifier — Gemini LLM, deterministic steps]
                           │
                           └── Qualified → [W3: Deposit — Stripe + Calendar]
                                                  │
                                                  └── Paid → [W4: Review — +2h after COMPLETED]
```

---

## GDPR / Compliance Notes

- All data stored in Firestore (europe-west2, UK/EU region)
- Consent logged with timestamp before any personal data collected
- Unconverted leads auto-purged after 12 months
- STOP/opt-out processed immediately, no further messages sent
- GDPR deletion: `DELETE /api/admin/leads/:id` — removes PII, retains anonymised KPI row
- GDPR export: `GET /api/admin/leads/:id/export` — full JSON of stored data
- Health data (conversation content) never appears in plain application logs

---

## Support

Any questions: review [`docs/reception-user-guide.md`](docs/reception-user-guide.md) for operational guidance.
For technical issues, check Cloud Run logs: `gcloud run services logs tail dental-automation --region europe-west2`
