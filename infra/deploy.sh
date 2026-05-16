#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FinVibe — Complete GCP Infrastructure Deployment Script
# JuaraVibeCoding Hackathon | Business Operations Category
#
# Usage:
#   1. Fill in the CONFIG section below
#   2. chmod +x deploy.sh
#   3. gcloud auth login && gcloud auth application-default login
#   4. ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ══════════════════════════════════════════════════════════
#  CONFIG — EDIT THESE BEFORE RUNNING
# ══════════════════════════════════════════════════════════
PROJECT_ID="projek-juaravibecoding"      # gcloud projects list
REGION="asia-southeast1"              # Jakarta region (lowest latency for ID)
GCS_BUCKET="finvibe-receipts-${PROJECT_ID}"
AR_REPO="finvibe-repo"
SERVICE_NAME="finvibe-backend"
SA_NAME="finvibe-sa"
BQ_DATASET="finvibe_dataset"
BQ_TABLE="transactions"
PUBSUB_TOPIC="finvibe-gcs-topic"
PUBSUB_SUB="finvibe-gcs-sub"
# ══════════════════════════════════════════════════════════

STEP=0
step() { STEP=$((STEP+1)); echo ""; echo "━━━ Step ${STEP}/9: $1 ━━━"; }

step "Set active GCP project"
gcloud config set project "${PROJECT_ID}"

step "Enable required GCP APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  bigquery.googleapis.com \
  storage.googleapis.com \
  pubsub.googleapis.com \
  iam.googleapis.com
echo "✓ APIs enabled"

step "Create GCS bucket (uniform access, Jakarta region)"
if gcloud storage buckets describe "gs://${GCS_BUCKET}" &>/dev/null; then
  echo "✓ Bucket already exists: gs://${GCS_BUCKET}"
else
  gcloud storage buckets create "gs://${GCS_BUCKET}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
  echo "✓ Bucket created: gs://${GCS_BUCKET}"
fi

# Add CORS policy so browser can PUT directly to GCS
cat > /tmp/cors.json <<EOF
[{"origin":["*"],"method":["PUT","GET"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]
EOF
gcloud storage buckets update "gs://${GCS_BUCKET}" --cors-file=/tmp/cors.json
echo "✓ CORS policy applied"

step "Create Service Account and assign IAM roles"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="FinVibe Backend Service Account"
fi

for ROLE in \
  roles/storage.objectAdmin \
  roles/datastore.user \
  roles/bigquery.dataEditor \
  roles/bigquery.jobUser \
  roles/aiplatform.user \
  roles/iam.serviceAccountTokenCreator; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None 2>/dev/null || true
done
echo "✓ IAM roles granted to ${SA_EMAIL}"

step "Create Artifact Registry Docker repository"
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" &>/dev/null; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="FinVibe container images"
fi
echo "✓ Artifact Registry repository ready"

step "Build and push container image via Cloud Build"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE_NAME}:latest"

# Cloud Build uses the Backend/ directory as build context
gcloud builds submit "../Backend" \
  --tag="${IMAGE}" \
  --region="${REGION}"
echo "✓ Image built and pushed: ${IMAGE}"

step "Deploy to Cloud Run"
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --service-account="${SA_EMAIL}" \
  --set-env-vars="\
GCP_PROJECT_ID=${PROJECT_ID},\
GCP_REGION=${REGION},\
GCS_BUCKET_NAME=${GCS_BUCKET},\
BQ_DATASET=${BQ_DATASET},\
BQ_TABLE=${BQ_TABLE}" \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" --format="value(status.url)")
echo "✓ Cloud Run deployed: ${SERVICE_URL}"

step "Set up Pub/Sub + GCS event notification"
# Create Pub/Sub topic
if ! gcloud pubsub topics describe "${PUBSUB_TOPIC}" &>/dev/null; then
  gcloud pubsub topics create "${PUBSUB_TOPIC}"
fi

# Grant the GCS service agent permission to publish
GCS_SA=$(gcloud storage service-agent --project="${PROJECT_ID}")
gcloud pubsub topics add-iam-policy-binding "${PUBSUB_TOPIC}" \
  --member="serviceAccount:${GCS_SA}" \
  --role=roles/pubsub.publisher 2>/dev/null || true

# Create bucket notification: OBJECT_FINALIZE → Pub/Sub topic
gcloud storage buckets notifications create "gs://${GCS_BUCKET}" \
  --topic="${PUBSUB_TOPIC}" \
  --event-types=OBJECT_FINALIZE \
  --payload-format=json 2>/dev/null || echo "  (notification may already exist)"

# Create Pub/Sub push subscription → Cloud Run webhook
if ! gcloud pubsub subscriptions describe "${PUBSUB_SUB}" &>/dev/null; then
  gcloud pubsub subscriptions create "${PUBSUB_SUB}" \
    --topic="${PUBSUB_TOPIC}" \
    --push-endpoint="${SERVICE_URL}/api/webhook/gcs" \
    --ack-deadline=600 \
    --push-auth-service-account="${SA_EMAIL}"
fi
echo "✓ Pub/Sub push subscription wired to Cloud Run"

step "Create BigQuery dataset and transaction table"
if ! bq ls --dataset "${PROJECT_ID}:${BQ_DATASET}" &>/dev/null; then
  bq --location="${REGION}" mk --dataset "${PROJECT_ID}:${BQ_DATASET}"
fi

if ! bq show "${PROJECT_ID}:${BQ_DATASET}.${BQ_TABLE}" &>/dev/null; then
  bq mk --table \
    "${PROJECT_ID}:${BQ_DATASET}.${BQ_TABLE}" \
    "../infra/bq_schema.json"
fi
echo "✓ BigQuery dataset and table ready"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎉 FinVibe Infrastructure Deployed! 🎉             ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Backend URL : ${SERVICE_URL}"
echo "║  GCS Bucket  : gs://${GCS_BUCKET}"
echo "║  Webhook     : ${SERVICE_URL}/api/webhook/gcs"
echo "║  BigQuery    : ${PROJECT_ID}.${BQ_DATASET}.${BQ_TABLE}"
echo "║  Health      : ${SERVICE_URL}/health"
echo "╚══════════════════════════════════════════════════════════════╝"
