#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy dental-automation to Cloud Run (europe-west2)
#
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth login)
#   - Docker daemon running
#   - .env.production file with all required env vars
#   - All secrets already added to Secret Manager
#
# Usage:
#   chmod +x infra/deploy.sh
#   GCP_PROJECT_ID=your-project ./infra/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID must be set}"
REGION="europe-west2"
SERVICE_NAME="dental-automation"
REPO="dental-automation-repo"
IMAGE_TAG="${IMAGE_TAG:-latest}"
AR_HOST="${REGION}-docker.pkg.dev"
IMAGE="${AR_HOST}/${PROJECT_ID}/${REPO}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🏥 Deploying ${SERVICE_NAME} to Cloud Run (${REGION})"
echo "   Project: ${PROJECT_ID}"
echo "   Image:   ${IMAGE}"
echo ""

# ── Step 1: Ensure Artifact Registry repo exists ──────────────────────────────
echo "📦 Ensuring Artifact Registry repository..."
gcloud artifacts repositories describe "${REPO}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --quiet 2>/dev/null || \
gcloud artifacts repositories create "${REPO}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --repository-format=docker \
  --description="Dental Automation container images"

# ── Step 2: Build and push image ───────────────────────────────────────────────
echo "🔨 Building container image..."
cd "$(dirname "$0")/../automation"

docker build \
  --platform linux/amd64 \
  --tag "${IMAGE}" \
  .

echo "📤 Pushing image to Artifact Registry..."
gcloud auth configure-docker "${AR_HOST}" --quiet
docker push "${IMAGE}"

# ── Step 3: Deploy to Cloud Run ────────────────────────────────────────────────
echo "🚀 Deploying to Cloud Run..."

# Build the --set-secrets flags
SECRETS=(
  "TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest"
  "TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest"
  "TWILIO_SMS_FROM=TWILIO_SMS_FROM:latest"
  "TWILIO_WHATSAPP_FROM=TWILIO_WHATSAPP_FROM:latest"
  "STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest"
  "STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest"
  "GEMINI_API_KEY=GEMINI_API_KEY:latest"
  "GOOGLE_CALENDAR_SA_KEY=GOOGLE_CALENDAR_SA_KEY:latest"
  "GOOGLE_CALENDAR_ID=GOOGLE_CALENDAR_ID:latest"
  "GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID:latest"
  "GOOGLE_OAUTH_CLIENT_SECRET=GOOGLE_OAUTH_CLIENT_SECRET:latest"
  "RESEND_API_KEY=RESEND_API_KEY:latest"
  "TURNSTILE_SECRET_KEY=TURNSTILE_SECRET_KEY:latest"
  "TASK_SECRET=TASK_SECRET:latest"
  "PMS_WEBHOOK_SECRET=PMS_WEBHOOK_SECRET:latest"
)

SET_SECRETS=$(IFS=','; echo "${SECRETS[*]}")

gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --platform=managed \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=60s \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION}" \
  --set-secrets="${SET_SECRETS}" \
  --service-account="dental-automation-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --allow-unauthenticated \
  --no-traffic \
  --tag="v-$(date +%Y%m%d-%H%M%S)"

# ── Step 4: Health check before shifting traffic ───────────────────────────────
echo "🏥 Running health check on new revision..."
REVISION_URL=$(gcloud run revisions list \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --service="${SERVICE_NAME}" \
  --format="value(status.url)" \
  --limit=1 \
  --sort-by="~creationTimestamp")

# Check health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${REVISION_URL}/health" || echo "000")

if [[ "${HTTP_STATUS}" != "200" ]]; then
  echo "❌ Health check failed (HTTP ${HTTP_STATUS}). Aborting traffic migration."
  exit 1
fi

echo "✅ Health check passed."

# ── Step 5: Migrate 100% traffic ──────────────────────────────────────────────
echo "🔀 Migrating 100% traffic to new revision..."
gcloud run services update-traffic "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --to-latest

# ── Done ──────────────────────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo "   Service URL: ${SERVICE_URL}"
echo "   Health:      ${SERVICE_URL}/health"
echo "   Widget:      ${SERVICE_URL}/widget.js"
echo ""
echo "   Update SERVICE_BASE_URL in Secret Manager if this is the first deploy."
echo ""
echo "⚠️  REMINDER: Do NOT deploy with live credentials until all tests pass."
