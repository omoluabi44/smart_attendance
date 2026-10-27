#!/usr/bin/env bash
# ============================================================================
# FacePass EC2 Host Bootstrap Script (Ubuntu 24.04 / 22.04 LTS)
# Executed automatically via Terraform user_data or manually on a fresh EC2 box.
# ============================================================================
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "[1/5] Configuring 2GB Swap Space to protect against OOM..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

echo "[2/5] Updating OS packages and installing prerequisites..."
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw fail2ban

echo "[3/5] Installing official Docker Engine & Docker Compose v2..."
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# Allow ubuntu user to run docker without sudo
if id "ubuntu" &>/dev/null; then
    usermod -aG docker ubuntu
fi

echo "[4/5] Configuring UFW Host Firewall (Ports 22, 80, 443)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[5/5] Creating application deployment directory /opt/facepass..."
mkdir -p /opt/facepass/infra/nginx
mkdir -p /opt/facepass/certbot/conf
mkdir -p /opt/facepass/certbot/www
if id "ubuntu" &>/dev/null; then
    chown -R ubuntu:ubuntu /opt/facepass
fi

echo "FacePass EC2 bootstrap complete!"
