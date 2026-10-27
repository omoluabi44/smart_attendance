# FacePass Production Deployment Guide (AWS EC2, RDS, S3, Rekognition, Docker, Nginx & GitHub Actions)

This guide walks you through launching **FacePass** (`facepass-web` + `Backend`) on AWS with full HTTPS (TLS 1.3), compartmentalized AWS Rekognition collections, ephemeral S3 presigned uploads, private RDS MySQL 8.0, and automated CI/CD via GitHub Actions.

---

## 1. Architecture Summary

- **Domain**: `https://facepass.coursepass.app`
  - `/` -> Routed by Nginx to `facepass_web` (Next.js 15 standalone container on port `3000`)
  - `/api/v1/*` -> Routed by Nginx to `facepass_api` (Flask + Gunicorn Eventlet on port `5001`)
  - `/apidocs` -> Swagger OpenAPI documentation
- **AWS Infrastructure (`infra/terraform/`)**:
  - **VPC**: `10.0.0.0/16` with 2 Public Subnets (EC2) and 2 Private Subnets (RDS MySQL).
  - **EC2**: Ubuntu 24.04 LTS (`t3.small`), Elastic IP, 30GB encrypted GP3 root volume, 2GB swap, UFW firewall (`22`, `80`, `443`), and **IAM Instance Profile** (IMDSv2 `hop_limit = 2`).
  - **RDS**: MySQL 8.0 (`db.t4g.micro`), encrypted GP3 storage, private subnets only, inbound `3306` restricted strictly to the EC2 Security Group.
  - **S3 Bucket**: Private bucket with `BlockPublicAccess`, AES-256 encryption, CORS enabled for presigned `PUT` uploads from `https://facepass.coursepass.app`, and a **24-hour Lifecycle Rule** that automatically deletes classroom media under `attendance_images/` and `attendance_videos/`.
  - **AWS Rekognition**: Accessed via EC2 IAM Role (no static AWS keys needed on the server) using compartmentalized per-course collections (`facepass_session_<session_id>`).

---

## 2. Step-by-Step Infrastructure Provisioning (Terraform)

### Prerequisites
- [Terraform](https://developer.hashicorp.com/terraform/downloads) `>= 1.5.0` and AWS CLI configured locally (`aws configure`).
- An SSH key pair (`ssh-keygen -t ed25519 -f ~/.ssh/facepass_deploy`).

### Provision AWS Resources
```bash
cd infra/terraform

# 1. Copy example variables and fill in your SSH public key & strong RDS password
cp terraform.tfvars.example terraform.tfvars

# 2. Initialize and apply Terraform
terraform init
terraform plan
terraform apply
```

### Record Terraform Outputs
Once `terraform apply` finishes (approx. 5–8 minutes for RDS creation), note the outputs:
```bash
terraform output
```
- `ec2_public_ip`: Point your DNS **A Record** for `facepass.coursepass.app` to this Elastic IP.
- `rds_host`: Use this as `BDYM_MYSQL_HOST` in GitHub Secrets.
- `s3_bucket_name`: Use this as `AWS_S3_BUCKET_NAME` in GitHub Secrets.

---

## 3. Configure GitHub Actions Secrets (CoursePass Style)

In your GitHub repository, navigate to **Settings -> Secrets and variables -> Actions** and add the following:

### Minimal Required Secrets:

| Secret Name | Value / Description |
| :--- | :--- |
| `EC2_IP` | `52.20.35.122` (Elastic IP from Terraform) |
| `EC2_SSH_KEY` | Full contents of your private SSH key (`~/.ssh/facepass_deploy`) |
| `EC2_USERNAME` | `ubuntu` (optional, defaults to `ubuntu`) |
| `ENV_FILE` (or `BACKEND_ENV_FILE`) | **The entire contents of your `.env.prod` file pasted as a single secret!** |

### Optional Secrets (if pushing images to Docker Hub instead of GitHub Packages):
| Secret Name | Value |
| :--- | :--- |
| `DOCKER_USERNAME` | Your Docker Hub username (e.g. `omoluabi44`) |
| `DOCKER_PASSWORD` | Your Docker Hub Personal Access Token |

---

### What to paste into `ENV_FILE` (Single Secret):

```dotenv
BDYM_TYPE_STORAGE=db
BDYM_ENV=production
BDYM_MYSQL_HOST=coursepass-db.cozkwemkcreu.us-east-1.rds.amazonaws.com
BDYM_MYSQL_USER=admin
BDYM_MYSQL_PWD=Mr_engineer44
BDYM_MYSQL_DB=facepass_db

SECRET_KEY=6d4f5cc023d5568358d53b919042333e399e22c866e9335c73cdbdac0a4febec
JWT_SECRET_KEY=a66e245e2e841ab144c91626fbd6f31b967e3d802abc7a0fbf96c6e084acab64
CORS_ORIGINS=https://facepass.coursepass.app,https://coursepass.app,https://www.coursepass.app

AWS_DEFAULT_REGION=us-east-1
AWS_S3_BUCKET_NAME=facepass-files-223784796667
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

COURSEPASS_WEBHOOK_URL=https://coursepass.app/api/v1/integrations/facepass/attendance-webhook
COURSEPASS_SERVICE_SECRET=acb930c42a0aa6de20afd5ac870471b4ef77f613a7b32990

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=

NEXT_PUBLIC_API_URL=https://facepass.coursepass.app/api/v1/
```

---

## 4. First Deployment & Issue Live Let's Encrypt SSL Certificate

1. **Trigger Deployment**:
   Push to `main` (or trigger **Build & Deploy FacePass to AWS EC2** manually in the GitHub Actions tab).
   - GitHub Actions will build both images, push them to `ghcr.io`, copy `docker-compose.prod.yml` and `infra/nginx/nginx.prod.conf` to `/opt/facepass`, generate a temporary self-signed certificate so Nginx boots cleanly, and start all 6 containers.

2. **Issue Production Let's Encrypt Certificate**:
   Once your DNS `A` record for `facepass.coursepass.app` resolves to `EC2_HOST`, SSH into the server and run `init-letsencrypt.sh` once:
   ```bash
   ssh -i ~/.ssh/facepass_deploy ubuntu@<EC2_PUBLIC_IP>
   cd /opt/facepass
   ./infra/scripts/init-letsencrypt.sh facepass.coursepass.app admin@coursepass.app
   ```
   Certbot will obtain a live TLS certificate and reload Nginx automatically. The `facepass_certbot` container will renew the certificate automatically every 12 hours.

---

## 5. Verification & Operations Commands

```bash
# Check container health & status on EC2
cd /opt/facepass
docker compose -f docker-compose.prod.yml ps

# Verify API & Database Healthcheck
curl -i https://facepass.coursepass.app/api/v1/health

# View real-time logs for API, Celery Worker, or Frontend
docker compose -f docker-compose.prod.yml logs -f facepass_api facepass_worker facepass_web
```
