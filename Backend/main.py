"""
FinVibe Backend — FastAPI on Google Cloud Run
Handles GCS webhook, Gemini multimodal OCR, Firestore + BigQuery writes, and FinVibe Coach.
Author: FinVibe Team | JuaraVibeCoding Hackathon
"""

import os
import json
import logging
from datetime import datetime, timezone, timedelta

import google.auth
from google.auth.transport import requests as google_auth_requests

import vertexai
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import firestore, bigquery, storage
from vertexai.generative_models import GenerativeModel, Part, GenerationConfig

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("finvibe")

# ── Environment Variables (injected by Cloud Run) ─────────────────────────────
PROJECT_ID    = os.environ["GCP_PROJECT_ID"]
REGION        = os.environ.get("GCP_REGION", "asia-southeast1")
GCS_BUCKET    = os.environ["GCS_BUCKET_NAME"]
FS_COLLECTION = os.environ.get("FIRESTORE_COLLECTION", "transactions")
BQ_DATASET    = os.environ.get("BQ_DATASET", "finvibe_dataset")
BQ_TABLE      = os.environ.get("BQ_TABLE", "transactions")

# ── GCP Client Initialization ─────────────────────────────────────────────────
# Vertex AI: us-central1 required — Gemini 1.5 Pro/Flash unavailable in asia-southeast1.
vertexai.init(project="finvibe-baa9d", location="us-central1")
db  = firestore.Client(project=PROJECT_ID)
bq  = bigquery.Client(project=PROJECT_ID)
gcs = storage.Client(project=PROJECT_ID)

# ── Gemini System Instruction ─────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """
You are a financial data extraction engine for Indonesian UMKM businesses.
Your sole task is to extract structured transaction data from receipt or invoice images.
You MUST always respond with a single, valid JSON object.
NEVER wrap output in markdown code fences (no triple backticks).
NEVER add explanatory text before or after the JSON.
If a field cannot be determined, use null.
All monetary values must be plain floats (no currency symbols, no thousand separators).
Dates must follow ISO 8601: YYYY-MM-DD.
"""

# ── Gemini Model Instances ─────────────────────────────────────────────────────
OCR_MODEL   = GenerativeModel("gemini-1.5-pro",   system_instruction=SYSTEM_INSTRUCTION)
COACH_MODEL = GenerativeModel("gemini-1.5-flash")

# ── OCR Prompt Template ────────────────────────────────────────────────────────
OCR_PROMPT = """
Extract all transaction data from this receipt image and return a JSON object with EXACTLY this schema:

{
  "transaction_date": "YYYY-MM-DD",
  "merchant_name": "string",
  "items": [
    {
      "item_name": "string",
      "quantity": 0,
      "price": 0.0,
      "total_item_price": 0.0
    }
  ],
  "total_amount": 0.0,
  "expense_category": "Raw Materials | Logistics | Utilities | Marketing | Others"
}

Rules:
- expense_category MUST be exactly one of: Raw Materials, Logistics, Utilities, Marketing, Others.
- If the receipt is handwritten, interpret legible text as best as possible.
- quantity is an integer, price and total_item_price are floats.
- Return ONLY the JSON. No markdown, no explanation, no extra keys.
"""

# ── FastAPI Application ────────────────────────────────────────────────────────
app = FastAPI(
    title="FinVibe API",
    description="AI-powered receipt OCR and financial analytics backend for UMKM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://finvibe-baa9d.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Utility Functions ──────────────────────────────────────────────────────────

def download_image_bytes(bucket_name: str, object_name: str) -> bytes:
    """Securely download an object from GCS as raw bytes using the service account."""
    bucket = gcs.bucket(bucket_name)
    blob   = bucket.blob(object_name)
    data   = blob.download_as_bytes()
    logger.info("GCS download: gs://%s/%s (%d bytes)", bucket_name, object_name, len(data))
    return data


def run_ocr(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Call Gemini 1.5 Pro with the receipt image and OCR prompt.
    Returns a parsed Python dict matching the schema.
    Raises ValueError if the model does not return valid JSON.
    """
    image_part = Part.from_data(data=image_bytes, mime_type=mime_type)
    config     = GenerationConfig(temperature=0.1, max_output_tokens=2048)

    response = OCR_MODEL.generate_content(
        [image_part, OCR_PROMPT],
        generation_config=config,
    )

    raw_text = response.text.strip()

    # Defensive: strip accidental markdown code fences
    if raw_text.startswith("```"):
        parts    = raw_text.split("```")
        raw_text = parts[1].strip()
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    try:
        parsed = json.loads(raw_text)
        logger.info("OCR success: merchant=%s total=%s", parsed.get("merchant_name"), parsed.get("total_amount"))
        return parsed
    except json.JSONDecodeError as exc:
        logger.error("OCR JSON parse error: %s | Raw output: %s", exc, raw_text[:500])
        raise ValueError(f"Gemini returned non-JSON output: {exc}")


def generate_coach_tip(transaction: dict) -> str:
    """
    Call Gemini 1.5 Flash to generate a 2-sentence FinVibe Coach financial tip
    in Bahasa Indonesia based on the extracted transaction data.
    """
    prompt = f"""
Kamu adalah FinVibe Coach, penasihat keuangan yang ramah dan cerdas untuk pemilik UMKM Indonesia.
Berdasarkan data transaksi berikut: {json.dumps(transaction, ensure_ascii=False)}

Tulis TEPAT 2 kalimat dalam Bahasa Indonesia:
1. Kalimat 1: Satu tips penghematan biaya atau saran efisiensi yang actionable, berdasarkan kategori pengeluaran dan jumlahnya.
2. Kalimat 2: Peringatan anomali jika total_amount terlihat sangat tinggi untuk kategori tersebut (misal: naik >20% dari wajar), ATAU kalimat penutup motivasi jika tampak normal.

Format output: Kembalikan HANYA 2 kalimat tersebut sebagai teks biasa. Tanpa JSON, tanpa bullet point, tanpa penomoran.
"""
    config   = GenerationConfig(temperature=0.7, max_output_tokens=256)
    response = COACH_MODEL.generate_content(prompt, generation_config=config)
    tip      = response.text.strip()
    logger.info("Coach tip generated: %s", tip[:80])
    return tip


def write_to_firestore(doc_id: str, data: dict) -> None:
    """Upsert a transaction document into Firestore for real-time dashboard updates."""
    ref = db.collection(FS_COLLECTION).document(doc_id)
    ref.set(data, merge=True)
    logger.info("Firestore upsert OK: collection=%s doc=%s", FS_COLLECTION, doc_id)


def write_to_bigquery(data: dict) -> None:
    """
    Stream a single transaction row into BigQuery for analytical queries.
    Items array is serialized as a JSON string in the items_json column.
    """
    table_ref = f"{PROJECT_ID}.{BQ_DATASET}.{BQ_TABLE}"

    row = {
        "doc_id":            data.get("doc_id"),
        "transaction_date":  data.get("transaction_date"),
        "merchant_name":     data.get("merchant_name"),
        "items_json":        json.dumps(data.get("items", []), ensure_ascii=False),
        "total_amount":      float(data["total_amount"]) if data.get("total_amount") is not None else None,
        "expense_category":  data.get("expense_category"),
        "coach_tip":         data.get("coach_tip"),
        "gcs_object":        data.get("gcs_object"),
        "processed_at":      data.get("processed_at"),
    }

    errors = bq.insert_rows_json(table_ref, [row])
    if errors:
        logger.error("BigQuery streaming insert errors: %s", errors)
        raise RuntimeError(f"BigQuery write failed: {errors}")
    logger.info("BigQuery streaming insert OK: doc_id=%s", data.get("doc_id"))


# ── Pipeline ───────────────────────────────────────────────────────────────────

async def process_receipt(bucket_name: str, object_name: str, mime_type: str) -> None:
    """
    Full async processing pipeline for a newly uploaded receipt:
      1. Download image bytes from GCS
      2. Run Gemini multimodal OCR → structured JSON
      3. Generate FinVibe Coach 2-sentence tip
      4. Persist to Firestore (real-time) + BigQuery (analytics)
    Errors are caught and recorded in Firestore so the UI can surface them.
    """
    doc_id = object_name.replace("/", "_").rsplit(".", 1)[0]

    try:
        # 1. Download
        image_bytes = download_image_bytes(bucket_name, object_name)

        # 2. OCR
        extracted = run_ocr(image_bytes, mime_type)

        # 3. FinVibe Coach
        coach_tip = generate_coach_tip(extracted)

        # 4. Compose document
        now      = datetime.now(timezone.utc).isoformat()
        document = {
            "doc_id":       doc_id,
            "gcs_object":   f"gs://{bucket_name}/{object_name}",
            "processed_at": now,
            "status":       "success",
            "coach_tip":    coach_tip,
            **extracted,
        }

        # 5. Persist
        write_to_firestore(doc_id, document)
        write_to_bigquery(document)

        logger.info("✅ Pipeline complete: %s", doc_id)

    except Exception as exc:
        logger.exception("❌ Pipeline failed for %s: %s", object_name, exc)
        # Record error state in Firestore so frontend can show a retry CTA
        try:
            db.collection(FS_COLLECTION).document(doc_id).set({
                "doc_id":       doc_id,
                "gcs_object":   f"gs://{bucket_name}/{object_name}",
                "status":       "error",
                "error":        str(exc),
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }, merge=True)
        except Exception as inner:
            logger.error("Failed to write error state to Firestore: %s", inner)


# ── API Routes ─────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Cloud Run liveness/readiness probe."""
    return {"status": "ok", "service": "finvibe-backend", "version": "1.0.0"}


@app.post("/api/upload-url", tags=["Upload"])
async def get_upload_url(filename: str, content_type: str = "image/jpeg"):
    """
    Generate a short-lived GCS signed URL for direct browser-to-GCS upload.
    Uses IAM token signing — compatible with Cloud Run (no service account key needed).
    """
    try:
        bucket    = gcs.bucket(GCS_BUCKET)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        blob_name = f"receipts/{timestamp}_{filename}"
        blob      = bucket.blob(blob_name)

        # Refresh ADC credentials to get a valid access token for signing
        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google_auth_requests.Request()
        credentials.refresh(auth_req)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="PUT",
            content_type=content_type,
            # Use IAM token signing — works in Cloud Run without a key file
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
        )
        logger.info("Signed URL created for: %s", blob_name)
        return {"upload_url": url, "object_name": blob_name}

    except Exception as exc:
        logger.exception("Signed URL generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Could not generate upload URL: {exc}")


@app.post("/api/webhook/gcs", tags=["Webhook"])
async def gcs_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives GCS Object Finalize events pushed via Pub/Sub push subscription.
    Returns HTTP 200 immediately (to ACK Pub/Sub) and processes in the background.

    Expected payload structure (Pub/Sub push envelope):
    {
      "message": {
        "attributes": {
          "bucketId": "my-bucket",
          "objectId": "receipts/image.jpg",
          "eventType": "OBJECT_FINALIZE"
        }
      }
    }
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON")

    message    = body.get("message", {})
    attributes = message.get("attributes", {})

    bucket_name = attributes.get("bucketId", "")
    object_name = attributes.get("objectId", "")
    event_type  = attributes.get("eventType", "")

    # Only process new file uploads; ignore deletions/metadata updates
    if event_type != "OBJECT_FINALIZE":
        logger.info("Skipping event_type=%s for %s", event_type, object_name)
        return {"status": "skipped", "reason": f"event_type={event_type}"}

    if not bucket_name or not object_name:
        raise HTTPException(status_code=400, detail="Missing bucketId or objectId in notification")

    # Infer MIME type from file extension
    ext      = object_name.rsplit(".", 1)[-1].lower() if "." in object_name else ""
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "pdf": "application/pdf"}
    mime_type = mime_map.get(ext, "image/jpeg")

    logger.info("Webhook received: gs://%s/%s (mime=%s)", bucket_name, object_name, mime_type)

    # Offload heavy work so we ACK Pub/Sub within 10s deadline
    background_tasks.add_task(
        process_receipt,
        bucket_name=bucket_name,
        object_name=object_name,
        mime_type=mime_type,
    )

    return {"status": "accepted", "object": object_name}
