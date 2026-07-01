FROM python:3.11-slim-bookworm

# Pinned to Debian 12 (bookworm), not the floating `python:3.11-slim` tag --
# Playwright 1.40's `install-deps` doesn't have a package mapping for Debian
# 13 (trixie, which `python:3.11-slim` now resolves to) and fails installing
# font packages that were renamed/removed there. bookworm is a release
# Playwright officially supports.
# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        postgresql-client \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (includes playwright -- the scraper pipeline
# drives headless Chromium via Playwright for sources with no usable API)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Install the OS-level packages Playwright's Chromium needs. `install-deps`
# resolves the correct apt packages for whatever Debian release this base
# image ships, so this stays correct across base image bumps.
RUN playwright install-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Download the Chromium browser binary itself. Run as appuser (not root) so
# it lands in appuser's cache dir (~/.cache/ms-playwright) with the right
# ownership for the runtime user that will launch it.
RUN playwright install chromium

# Create directories for ML models and logs
RUN mkdir -p /tmp/ml_models /tmp/logs

# Expose port
EXPOSE 8000

# Health check (uses dynamic PORT for Railway compatibility)
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run the application (Railway sets PORT env var)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]