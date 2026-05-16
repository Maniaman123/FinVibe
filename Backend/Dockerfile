# ── Stage 1: Dependency builder ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install only the minimal build tools required for native extensions
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install packages into a separate prefix so we can copy them cleanly
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Lean runtime image ───────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY main.py .

# Cloud Run injects PORT; default to 8080
ENV PORT=8080

# Run as a non-root user for security best practice
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8080

# 2 Uvicorn workers; Cloud Run handles horizontal scaling via container replicas
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
