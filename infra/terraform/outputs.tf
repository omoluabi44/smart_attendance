output "ec2_public_ip" {
  description = "Elastic IP address of the FacePass EC2 server (Point your DNS A record for facepass.coursepass.app here)"
  value       = aws_eip.app_eip.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS hostname of the EC2 server"
  value       = aws_eip.app_eip.public_dns
}

output "rds_endpoint" {
  description = "RDS MySQL connection endpoint (host:port)"
  value       = "${var.existing_rds_host}:3306"
}

output "rds_host" {
  description = "RDS MySQL hostname (use as BDYM_MYSQL_HOST in .env.prod / GitHub Secrets)"
  value       = var.existing_rds_host
}

output "s3_bucket_name" {
  description = "S3 Bucket name for presigned uploads and materials (use as AWS_S3_BUCKET_NAME)"
  value       = aws_s3_bucket.media.bucket
}

output "ec2_iam_role_arn" {
  description = "IAM Role ARN attached to the EC2 instance for Rekognition & S3 access"
  value       = aws_iam_role.ec2_role.arn
}
