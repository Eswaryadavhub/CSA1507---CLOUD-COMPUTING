# TourPulse: Google Cloud Platform (GCP) Deployment & Big Data Guide

This directory contains the production-grade Big Data artifacts for executing the **Cloud-Based Tourist Flow and Attraction Analytics** pipeline on Google Cloud Platform.

---

## 1. Cloud Architecture Flow

```
[GPS Feeds / Travel Apps / Check-ins]
                 ↓
[Google Cloud Storage] gs://tourpulse-raw-data/
                 ↓
[Google Cloud Dataproc] (PySpark MapReduce tourist_flow_job.py)
                 ↓
[Google Cloud Storage] gs://tourpulse-processed-data/
                 ↓
[Google BigQuery] tourist_analytics (Data Warehouse)
                 ↓
[BigQuery ML] ARIMA_PLUS Model (Demand Forecasting)
                 ↓
[FastAPI Backend / Looker Studio] Visual Dashboards & Maps
```

---

## 2. Google Cloud Storage Setup

Create the raw and processed staging buckets in your GCP project:

```bash
# Set project environment variable
export GCP_PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Create Cloud Storage Buckets
gcloud storage buckets create gs://tourpulse-raw-data-${GCP_PROJECT_ID} --location=${REGION}
gcloud storage buckets create gs://tourpulse-processed-data-${GCP_PROJECT_ID} --location=${REGION}

# Upload raw check-in batches to GCS
gcloud storage cp ../data/sample_checkins.csv gs://tourpulse-raw-data-${GCP_PROJECT_ID}/checkins/
```

---

## 3. Google Cloud Dataproc Execution

Create a Dataproc cluster and submit the PySpark MapReduce job:

```bash
# 1. Create Dataproc Cluster (e.g. 1 Master, 2 Worker nodes)
gcloud dataproc clusters create tourpulse-dataproc-cluster \
    --region=${REGION} \
    --zone=${REGION}-a \
    --master-machine-type=n1-standard-2 \
    --num-workers=2 \
    --worker-machine-type=n1-standard-2 \
    --image-version=2.1-debian11

# 2. Submit the PySpark MapReduce Job
gcloud dataproc jobs submit pyspark dataproc/tourist_flow_job.py \
    --cluster=tourpulse-dataproc-cluster \
    --region=${REGION} \
    -- \
    --input_path=gs://tourpulse-raw-data-${GCP_PROJECT_ID}/checkins/ \
    --output_path=gs://tourpulse-processed-data-${GCP_PROJECT_ID}/analytics/
```

---

## 4. Google BigQuery Data Warehouse Loading

Execute the SQL scripts to build the analytics tables and views:

```bash
# 1. Initialize dataset and tables
bq query --use_legacy_sql=false < bigquery/schema.sql

# 2. Run analytical aggregation queries
bq query --use_legacy_sql=false < bigquery/analytics_queries.sql

# 3. Train BigQuery ML ARIMA_PLUS forecasting model
bq query --use_legacy_sql=false < bigquery/forecasting.sql
```

---

## 5. Connecting Looker Studio

1. Open [Google Looker Studio](https://lookerstudio.google.com/).
2. Click **Create** ➔ **Data Source** ➔ Select **BigQuery**.
3. Select your GCP Project ➔ Dataset `tourist_analytics` ➔ Table `attraction_analytics` or View `tourist_flow_daily`.
4. Build geographical heatmaps and time-series line graphs directly connected to BigQuery.
