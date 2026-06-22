FROM python:3.12-slim@sha256:e1e3d9f35c1b50b1b2e5f4d25be372ece6965d0ca73c2e2cb98e71d1f9e60f0f

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
