# ── Terraform configuration for Dental Automation infrastructure ────────────
# Provisions: Cloud Tasks queues, Firestore database, IAM bindings
# Region: europe-west2 (London) — EU/UK data residency

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # Uncomment to use GCS backend for state
  # backend "gcs" {
  #   bucket = "YOUR_TERRAFORM_STATE_BUCKET"
  #   prefix = "dental-automation/terraform.tfstate"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Cloud Tasks Queues ────────────────────────────────────────────────────────

resource "google_cloud_tasks_queue" "reminders" {
  name     = "automation-reminders"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 500
    max_concurrent_dispatches = 100
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "5s"
    max_backoff        = "300s"
    max_doublings      = 5
    max_retry_duration = "3600s"
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

resource "google_cloud_tasks_queue" "reviews" {
  name     = "automation-reviews"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 100
    max_concurrent_dispatches = 20
  }

  retry_config {
    max_attempts       = 3
    min_backoff        = "10s"
    max_backoff        = "600s"
    max_doublings      = 4
    max_retry_duration = "3600s"
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

resource "google_cloud_tasks_queue" "jobs" {
  name     = "automation-jobs"
  location = var.region

  rate_limits {
    max_dispatches_per_second = 1000
    max_concurrent_dispatches = 200
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "2s"
    max_backoff        = "120s"
    max_doublings      = 5
    max_retry_duration = "1800s"
  }

  stackdriver_logging_config {
    sampling_ratio = 0.1
  }
}

# ── Firestore Database ────────────────────────────────────────────────────────

resource "google_firestore_database" "main" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # UK data residency
  app_engine_integration_mode = "DISABLED"

  delete_protection_state = "DELETE_PROTECTION_ENABLED"
}

# ── Firestore Composite Indexes ───────────────────────────────────────────────

resource "google_firestore_index" "leads_by_status_created" {
  collection = "leads"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "leads_by_appointment" {
  collection = "leads"

  fields {
    field_path = "appointmentDateTime"
    order      = "ASCENDING"
  }
  fields {
    field_path = "status"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "leads_by_emergency_created" {
  collection = "leads"

  fields {
    field_path = "emergency"
    order      = "ASCENDING"
  }
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# ── Secret Manager Secrets ────────────────────────────────────────────────────
# Secrets are created here (empty). Values must be added manually.

locals {
  secret_ids = [
    "TWILIO_AUTH_TOKEN",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_SMS_FROM",
    "TWILIO_WHATSAPP_FROM",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GEMINI_API_KEY",
    "GOOGLE_CALENDAR_SA_KEY",
    "GOOGLE_CALENDAR_ID",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "RESEND_API_KEY",
    "TURNSTILE_SECRET_KEY",
    "TASK_SECRET",
    "PMS_WEBHOOK_SECRET",
  ]
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(local.secret_ids)
  secret_id = each.key

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  labels = {
    app = "dental-automation"
  }
}

# ── Cloud Run Service Account ─────────────────────────────────────────────────

resource "google_service_account" "run_sa" {
  account_id   = "dental-automation-run"
  display_name = "Dental Automation Cloud Run Service Account"
}

# Grant access to all secrets
resource "google_secret_manager_secret_iam_member" "run_sa_secrets" {
  for_each  = toset(local.secret_ids)
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run_sa.email}"
}

# Firestore access
resource "google_project_iam_member" "run_sa_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# Cloud Tasks enqueue
resource "google_project_iam_member" "run_sa_tasks" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# Cloud Logging
resource "google_project_iam_member" "run_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# ── Cloud Scheduler — Daily Summary ──────────────────────────────────────────

resource "google_cloud_scheduler_job" "daily_summary" {
  name      = "dental-automation-daily-summary"
  region    = var.region
  schedule  = "0 20 * * 1-5"  # 20:00 Mon-Fri London time (close of business)
  time_zone = "Europe/London"

  http_target {
    http_method = "POST"
    uri         = "${var.service_url}/webhooks/tasks"

    headers = {
      "Content-Type"  = "application/json"
      "X-Task-Secret" = "$(TASK_SECRET)"
    }

    body = base64encode(jsonencode({
      jobType      = "SEND_DAILY_SUMMARY"
      leadId       = "SYSTEM"
      scheduledFor = "now"
    }))
  }
}
