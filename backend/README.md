# 4ensics — Multi-Modal Deepfake & Forensic Analysis System

An enterprise-grade forensic detection platform supporting four multi-modal analysis capabilities (**Video, Image, Audio, Text**) backed by a local **MySQL** relational database and high-performance **FastAPI** backend with PyTorch ViViT model inference.

---

## 🗄️ Database Architecture (MySQL 8.0)

The relational schema implements the complete **4ensics Database Design (ERD)** across 17 structured tables:

### 1. Authentication & User Management
- `app_user`: Analysts and administrators (`user_id`, `full_name`, `email`, `password_hash`, `role`, `status`, `email_verified`).
- `user_session`: Active sessions and JWT/refresh tokens (`session_id`, `user_id`, `refresh_token_hash`, `expires_at`, `revoked`).
- `password_reset_token`: Single-use recovery tokens (`token_id`, `user_id`, `token_hash`, `used`, `expires_at`).
- `email_verification_token`: Email verification tokens (`token_id`, `user_id`, `token_hash`, `verified_at`).

### 2. Media Ingestion & Job Pipeline
- `scan_batch`: Multi-file case grouping (`batch_id`, `user_id`, `reference_label`, `analysis_profile`, `priority`).
- `media_upload`: File metadata and SHA-256 fingerprint (`upload_id`, `user_id`, `batch_id`, `media_type`, `file_format`, `file_hash_sha256`, `retention_status`).
- `analysis_job`: Asynchronous job execution tracking (`job_id`, `upload_id`, `status`, `progress_pct`, `started_at`, `completed_at`).

### 3. Model Registry & Scoring Engine
- `ai_model`: Model metadata registry (`model_id`, `name`, `version`, `modality`, `accuracy`, `is_active`).
- `scoring_config`: Multi-modal weight configurations and risk band thresholds (`scoring_config_id`, `low_max`, `medium_max`, `module_weights_json`).
- `analysis_report`: Unified fused forensic verdict (`report_id`, `upload_id`, `job_id`, `scoring_config_id`, `fused_score`, `confidence`, `risk_band`, `verdict`, `review_status`).

### 4. Forensic Modality Modules & Auditing
- `video_analysis` & `video_chunk_score`: ViViT deep temporal sliding-window analysis with chunk timestamps and fake probabilities.
- `image_analysis`: Error Level Analysis (ELA), Fast Fourier Transform (FFT) frequency spectrum, and 8-feature forensic vectors.
- `audio_analysis`: Acoustic perturbation analysis (pitch jitter, amplitude shimmer, Harmonics-to-Noise Ratio `HNR`, sample rate).
- `text_analysis` & `url_scam_check`: Perplexity, burstiness, Type-Token Ratio (`TTR`), and flagged phishing/malware URLs.
- `analysis_review`: Human auditor review trail (`review_id`, `report_id`, `reviewed_by`, `action`, `notes`).

---

## ⚙️ Configuration (`backend/.env`)

Configure your MySQL database and SMTP email delivery settings in `backend/.env`:

```env
# Database Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Sridhar@2006
DB_NAME=fourensics_db

# SMTP Configuration for Automated HTML Email Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=notifications@4ensics.ai
SMTP_FROM_NAME=4ensics Forensic Platform
PLATFORM_URL=http://localhost:5173
```

> **Note for Gmail users**: Use a 16-character [Google App Password](https://myaccount.google.com/apppasswords) for `SMTP_PASSWORD` with 2-Step Verification enabled.

---

## 🚀 Running the Platform

### 1. Initialize Database Schema & Seed Baseline Data
```bash
py backend/init_db.py
```

### 2. Start the Backend API Server
```bash
py backend/backend.py
# Runs on http://localhost:8000
```

### 3. Start the Frontend Dashboard
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## 📧 Automated Email Notifications

The system dispatches formatted HTML emails via SMTP for:
1. **User Added / Invited**: Notifies the invited user that an administrator/analyst added them to 4ensics with initial login credentials and platform access link.
2. **Password Recovery**: Delivers secure single-use reset tokens with 30-minute expiry.
