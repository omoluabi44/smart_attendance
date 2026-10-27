#!/usr/bin/env bash
# ============================================================================
# FacePass Let's Encrypt SSL Bootstrap Script
# Run once on EC2 after DNS A record for facepass.coursepass.app points to EC2 IP:
#   chmod +x infra/scripts/init-letsencrypt.sh
#   ./infra/scripts/init-letsencrypt.sh facepass.coursepass.app admin@coursepass.app
# ============================================================================
set -euo pipefail

DOMAIN="${1:-facepass.coursepass.app}"
EMAIL="${2:-admin@coursepass.app}"
STAGING="${3:-0}" # Set to 1 to test against Let's Encrypt staging environment
DATA_PATH="./certbot"
RSA_KEY_SIZE=4096

echo ">>> Initializing Let's Encrypt certificate for $DOMAIN ($EMAIL)..."

mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
mkdir -p "$DATA_PATH/www"

# 1. Create temporary dummy certificate so Nginx can start on port 443
echo ">>> Creating dummy certificate for $DOMAIN..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1\
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# 2. Start Nginx
echo ">>> Starting Nginx container..."
docker compose -f docker-compose.prod.yml up --force-recreate -d nginx

# 3. Remove dummy certificate before requesting live Let's Encrypt certificate
echo ">>> Deleting dummy certificate for $DOMAIN..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# 4. Request Let's Encrypt certificate via webroot
echo ">>> Requesting Let's Encrypt certificate for $DOMAIN..."
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
  STAGING_ARG="--staging"
fi

docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

# 5. Reload Nginx to apply live certificate
echo ">>> Reloading Nginx with production TLS certificate..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ">>> SSL setup complete for https://$DOMAIN !"
