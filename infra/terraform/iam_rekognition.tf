# ─── EC2 IAM Role & Instance Profile for S3 + AWS Rekognition ─────────────────

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_role" {
  name               = "${var.project_name}-ec2-rekognition-s3-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

data "aws_iam_policy_document" "facepass_permissions" {
  # 1. S3 Bucket Permissions (Presigned URLs, Fetching Group Photos, Course Materials)
  statement {
    sid    = "FacePassS3BucketAccess"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]
    resources = [
      aws_s3_bucket.media.arn
    ]
  }

  statement {
    sid    = "FacePassS3ObjectAccess"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = [
      "${aws_s3_bucket.media.arn}/*"
    ]
  }

  # 2. AWS Rekognition Per-Course Collections & Face Search Permissions
  statement {
    sid    = "FacePassRekognitionAccess"
    effect = "Allow"
    actions = [
      "rekognition:CreateCollection",
      "rekognition:DeleteCollection",
      "rekognition:DescribeCollection",
      "rekognition:ListCollections",
      "rekognition:IndexFaces",
      "rekognition:DeleteFaces",
      "rekognition:ListFaces",
      "rekognition:SearchFaces",
      "rekognition:SearchFacesByImage",
      "rekognition:CreateUser",
      "rekognition:DeleteUser",
      "rekognition:ListUsers",
      "rekognition:AssociateFaces",
      "rekognition:DisassociateFaces",
      "rekognition:SearchUsers",
      "rekognition:SearchUsersByImage",
      "rekognition:DetectFaces",
      "rekognition:CompareFaces",
      "rekognition:StartFaceSearch",
      "rekognition:GetFaceSearch"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "facepass_aws_access" {
  name   = "${var.project_name}-rekognition-s3-policy"
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.facepass_permissions.json
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}
