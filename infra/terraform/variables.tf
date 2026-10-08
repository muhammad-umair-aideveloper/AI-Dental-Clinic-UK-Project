variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region (must be europe-west2 for UK data residency)"
  type        = string
  default     = "europe-west2"

  validation {
    condition     = var.region == "europe-west2"
    error_message = "Region must be europe-west2 to comply with UK data residency requirements."
  }
}

variable "service_url" {
  description = "Deployed Cloud Run service URL (e.g. https://dental-automation-xxx-nw.a.run.app)"
  type        = string
}

variable "image" {
  description = "Container image to deploy (e.g. europe-west2-docker.pkg.dev/PROJECT/repo/dental-automation:latest)"
  type        = string
}
