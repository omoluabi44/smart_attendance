# 1. Use a lightweight Python version
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for MySQL & curl for container healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Ensure uploads directory exists and create non-root user
RUN mkdir -p /app/uploads && \
    addgroup --system --gid 1001 facepass && \
    adduser --system --uid 1001 --gid 1001 facepass && \
    chown -R facepass:facepass /app

USER facepass

EXPOSE 5001

# Production Gunicorn server with eventlet worker
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5001", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "--capture-output", "--log-level", "info", "run:app"]
