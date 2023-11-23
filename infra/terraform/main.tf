terraform {
  backend "gcs" {
    prefix  = "terraform/state"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.7.0"
    }
  }
}
