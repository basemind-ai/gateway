variable "gcp_project_id" {
  type    = string
  default = "basemind-ai-development"
}

variable "gcp_region" {
  type    = string
  default = "europe-west3"
}

variable "gcp_zone" {
  type    = string
  default = "europe-west3-a"
}

variable "environment" {
  type    = string
  default = "development"
}

variable "project_prefix" {
  type    = string
  default = "basemind-ai"
}

variable "redis_node_type" {
  type    = string
  default = "g1-small"
}

variable "redis_node_disk_size" {
  type    = string
  default = "16"
}

variable "redis_node_os_image" {
  type    = string
  default = "projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20231030"
}
