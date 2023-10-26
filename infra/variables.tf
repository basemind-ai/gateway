variable "service_name" {
  type = string
}
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
variable "docker_tag" {
  type    = string
  default = "latest"
}
