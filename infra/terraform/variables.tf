variable "aws_region" {
  description = "AWS region for all FacePass resources (must support AWS Rekognition)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Prefix used for naming AWS resources"
  type        = string
  default     = "facepass"
}

variable "domain_name" {
  description = "Primary HTTPS domain for the FacePass application"
  type        = string
  default     = "face.coursepass.app"
}

variable "vpc_cidr" {
  description = "CIDR block for the FacePass VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ec2_instance_type" {
  description = "EC2 instance size for running Docker containers (t3.small or t3.medium recommended)"
  type        = string
  default     = "t3.small"
}

variable "ec2_root_volume_size" {
  description = "Root GP3 volume size in GB for the EC2 host"
  type        = number
  default     = 30
}

variable "ssh_public_key" {
  description = "SSH public key (e.g. ssh-ed25519 / ssh-rsa) for ubuntu user & GitHub Actions deployment"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks permitted to SSH into the EC2 instance"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "db_instance_class" {
  description = "RDS MySQL instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "MySQL database name created on RDS launch"
  type        = string
  default     = "facepass_db"
}

variable "db_username" {
  description = "Master username for RDS MySQL"
  type        = string
  default     = "facepass_admin"
}

variable "db_password" {
  description = "Master password for RDS MySQL (at least 8 characters)"
  type        = string
  sensitive   = true
}

variable "db_multi_az" {
  description = "Enable Multi-AZ standby replica for RDS MySQL"
  type        = bool
  default     = false
}

variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name for FacePass presigned uploads & course materials"
  type        = string
  default     = "facepass-file-prod"
}

variable "media_retention_days" {
  description = "Days before classroom attendance images/videos are automatically purged from S3 (Privacy Guardrail)"
  type        = number
  default     = 1
}
