resource "google_compute_instance" "redis-node" {
  name         = join("-", [var.project_prefix, "redis", var.environment])
  machine_type = var.redis_node_type
  zone         = var.gcp_zone

  labels = {
    service     = "redis"
    environment = var.environment
  }

  boot_disk {
    initialize_params {
      size  = var.redis_node_disk_size
      image = var.redis_node_os_image
    }
  }

  metadata_startup_script = "#!/bin/bash\napt update\napt install redis -y"

  network_interface {
    network = "default"

    access_config {}
  }
}
