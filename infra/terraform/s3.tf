resource "aws_s3_bucket" "media" {
  bucket = var.s3_bucket_name

  tags = {
    Name = "${var.project_name}-media-bucket"
  }
}

# 1. Block all public bucket access (Access is exclusively via Presigned URLs & IAM Role)
resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Enforce Server-Side Encryption at rest (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 3. CORS Configuration for direct browser Presigned URL uploads from FacePass Web
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_origins = [
      "https://${var.domain_name}",
      "https://coursepass.app",
      "https://www.coursepass.app",
      "http://localhost:3000"
    ]
    expose_headers  = ["ETag", "x-amz-request-id"]
    max_age_seconds = 3600
  }
}

# 4. Biometric Privacy Guardrail: Auto-purge classroom attendance images/videos after 24 hours
resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "purge-ephemeral-attendance-images"
    status = "Enabled"

    filter {
      prefix = "attendance_images/"
    }

    expiration {
      days = var.media_retention_days
    }
  }

  rule {
    id     = "purge-ephemeral-attendance-videos"
    status = "Enabled"

    filter {
      prefix = "attendance_videos/"
    }

    expiration {
      days = var.media_retention_days
    }
  }

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
