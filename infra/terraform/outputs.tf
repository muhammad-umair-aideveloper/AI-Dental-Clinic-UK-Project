output "reminders_queue_name" {
  value       = google_cloud_tasks_queue.reminders.name
  description = "Cloud Tasks reminders queue name"
}

output "reviews_queue_name" {
  value       = google_cloud_tasks_queue.reviews.name
  description = "Cloud Tasks reviews queue name"
}

output "jobs_queue_name" {
  value       = google_cloud_tasks_queue.jobs.name
  description = "Cloud Tasks jobs queue name"
}

output "run_service_account_email" {
  value       = google_service_account.run_sa.email
  description = "Cloud Run service account email"
}

output "firestore_database_name" {
  value       = google_firestore_database.main.name
  description = "Firestore database name"
}
