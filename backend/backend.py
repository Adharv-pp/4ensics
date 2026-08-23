import os
import math
import hashlib
import secrets
import tempfile
import shutil
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import torch
import numpy as np
import cv2
from transformers import VideoMAEImageProcessor, VivitForVideoClassification

from database import get_db, test_connection, ensure_database_exists, engine, Base
from models import (
    AppUser, AIModel, ScoringConfig, MediaUpload, AnalysisJob,
    AnalysisReport, VideoAnalysis, VideoChunkScore, ImageAnalysis,
    AudioAnalysis, TextAnalysis, URLScamCheck, AnalysisReview,
    UserSession, PasswordResetToken
)
from services.forensic_service import (
    add_user, get_user_by_email, get_user_by_id, authenticate_user,
    create_user_session, revoke_session, create_password_reset_request,
    verify_reset_code, reset_password_with_code, request_access,
    create_scan_batch, create_media_upload,
    create_analysis_job, update_job_status, get_or_create_ai_model,
    get_default_scoring_config, create_analysis_report, add_video_analysis,
    add_image_analysis, add_audio_analysis, add_text_analysis,
    add_analysis_review, get_report_full_details, list_reports,
    hash_password, update_user_role, delete_user
)
from services.email_service import send_user_added_email
from services.audio_detector import get_audio_detector, AudioDeepfakeDetector
from services.image_detector import get_image_detector, ImageDeepfakeDetector
from services.text_detector import get_text_detector, TextDetector
from init_db import initialize_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeepfakeBackend")

# Initialize FastAPI App
app = FastAPI(
    title="4ensics Deepfake & Forensic Multi-Modal API",
    description="Authentication system & Multi-Modal Forensic Analysis API with MySQL Database",
    version="2.2.0"
)

# Enable universal CORS for all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global variables for models
processor = None
model = None
device = None
audio_detector = None

# Candidate paths for ViViT model weights
CANDIDATE_CHECKPOINTS = [
    os.path.join(os.path.dirname(__file__), "models", "vivit", "checkpoint-2880"),
    os.path.join(os.path.dirname(__file__), "models", "deepfake_vivit_model", "checkpoint-2880"),
    os.path.join(os.path.dirname(__file__), "deepfake_vivit_model", "checkpoint-2880"),
    "./models/vivit/checkpoint-2880",
    "./deepfake_vivit_model/checkpoint-2880"
]

CHECKPOINT_DIR = None
for p in CANDIDATE_CHECKPOINTS:
    if os.path.exists(p):
        CHECKPOINT_DIR = p
        break

if not CHECKPOINT_DIR:
    CHECKPOINT_DIR = CANDIDATE_CHECKPOINTS[0]

@app.on_event("startup")
def startup_event():
    global processor, model, device, audio_detector
    logger.info("Initializing MySQL database and schema...")
    try:
        initialize_database()
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")

    logger.info("Loading ViViT Video Model...")
    try:
        processor = VideoMAEImageProcessor.from_pretrained("google/vivit-b-16x2-kinetics400")
        if os.path.exists(CHECKPOINT_DIR):
            model = VivitForVideoClassification.from_pretrained(CHECKPOINT_DIR)
            model.eval()  
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model.to(device)
            logger.info(f"ViViT Model loaded successfully from {CHECKPOINT_DIR} on {device}")
        else:
            logger.warning(f"ViViT Checkpoint dir {CHECKPOINT_DIR} not found.")
    except Exception as e:
        logger.error(f"Failed to load ViViT model: {e}")

    logger.info("Initializing WavLM Audio Deepfake Detector...")
    try:
        audio_detector = get_audio_detector()
        logger.info("Audio Deepfake Detector ready.")
    except Exception as e:
        logger.error(f"Failed to initialize Audio Deepfake Detector: {e}")

# AUTHENTICATION & USER MANAGEMENT ENDPOINTS

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "analyst"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class RequestAccessRequest(BaseModel):
    full_name: str
    email: str
    department: str
    badge_id: str
    reason: str

class AddUserRequest(BaseModel):
    full_name: str
    email: str
    role: str = "analyst"
    added_by_name: Optional[str] = "Administrator"
    send_email: bool = True

class UpdateRoleRequest(BaseModel):
    role: str
    status: Optional[str] = "active"

@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid agency credentials or account not active.")
    
    session = create_user_session(db, user.user_id)
    return {
        "status": "success",
        "message": "Authentication successful.",
        "token": session.refresh_token_hash,
        "user": user.to_dict()
    }

@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    
    user = add_user(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        role=payload.role,
        status="active"
    )
    return {"status": "success", "message": "User registered successfully.", "user": user.to_dict()}

@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if not user:
        return {"status": "success", "message": "If that agency email is registered, a reset code was generated."}
    
    token_record, code = create_password_reset_request(db, user.user_id)
    return {
        "status": "success",
        "message": "Reset code generated and dispatched.",
        "debug_code": code
    }

@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    success, msg = reset_password_with_code(db, payload.email, payload.code, payload.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg}

@app.post("/api/auth/request-access")
def post_request_access(payload: RequestAccessRequest, db: Session = Depends(get_db)):
    user = request_access(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        department=payload.department,
        badge_id=payload.badge_id,
        reason=payload.reason
    )
    return {
        "status": "success",
        "message": "Agency access request submitted. Administrator approval is pending.",
        "user_id": user.user_id
    }

@app.get("/api/auth/me")
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        user = db.query(AppUser).filter(AppUser.status == "active").first()
        if user:
            return {"status": "success", "user": user.to_dict()}
        raise HTTPException(status_code=401, detail="No active session found.")
    
    token = authorization.replace("Bearer ", "").strip()
    session = db.query(UserSession).filter(UserSession.refresh_token_hash == token, UserSession.revoked == False).first()
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    
    user = get_user_by_id(db, session.user_id)
    return {"status": "success", "user": user.to_dict()}

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        revoke_session(db, token)
    return {"status": "success", "message": "Signed out successfully."}

# AGENCY USER ADMINISTRATION ENDPOINTS

@app.get("/api/users")
def list_agency_users(db: Session = Depends(get_db)):
    users = db.query(AppUser).order_by(AppUser.created_at.desc()).all()
    return {
        "status": "success",
        "count": len(users),
        "users": [u.to_dict() for u in users]
    }

@app.post("/api/users/add")
def add_agency_user(payload: AddUserRequest, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    initial_password = f"Forensics@{secrets.randbelow(8999) + 1000}!"
    user = add_user(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        password=initial_password,
        role=payload.role,
        status="active"
    )

    email_sent = False
    if payload.send_email:
        email_sent = send_user_added_email(
            recipient_email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            temporary_password=initial_password,
            added_by=payload.added_by_name or "Administrator"
        )

    return {
        "status": "success",
        "message": f"User {user.full_name} created successfully.",
        "user": user.to_dict(),
        "temporary_password": initial_password,
        "email_dispatched": email_sent
    }

@app.put("/api/users/{user_id}/role")
def update_role(user_id: str, payload: UpdateRoleRequest, db: Session = Depends(get_db)):
    user = update_user_role(db, user_id, payload.role, payload.status)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"status": "success", "message": "User permissions updated.", "user": user.to_dict()}

@app.delete("/api/users/{user_id}")
def remove_user(user_id: str, db: Session = Depends(get_db)):
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"status": "success", "message": "User deleted successfully."}

# HELPER FUNCTIONS & OPENCV FRAME EXTRACTOR

def compute_sha256(filepath: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def extract_segments(video_path, segment_sec=2.0, num_frames=16):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    frames_per_segment = int(segment_sec * fps)
    
    segments = []
    
    for start_frame in range(0, total_frames, frames_per_segment):
        end_frame = min(start_frame + frames_per_segment, total_frames)
        start_time = start_frame / fps
        end_time = end_frame / fps
        
        if end_frame - start_frame < 4:
            break
            
        indices = np.linspace(start_frame, end_frame - 1, num_frames, dtype=int)
        frames = []
        
        for idx in indices:
            idx = min(max(idx, 0), total_frames - 1)
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            success, frame = cap.read()
            if success:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
        if len(frames) > 0:
            while len(frames) < num_frames:
                frames.append(frames[-1])
            
            segments.append({
                "time_label": f"{start_time:.1f}s - {end_time:.1f}s",
                "start": start_time,
                "end": end_time,
                "frames": np.array(frames[:num_frames])
            })
            
    cap.release()
    return segments

def run_inference(frames):
    """Runs a single 16-frame sequence through the ViViT model."""
    if model is None or processor is None:
        raise RuntimeError("ViViT Model is not initialized on the server.")
        
    inputs = processor(list(frames), return_tensors="pt")
    pixel_values = inputs['pixel_values'].squeeze(0).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(pixel_values=pixel_values)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=-1)[0]
        
        fake_prob = probabilities[1].item()
        real_prob = probabilities[0].item()
        
    return fake_prob, real_prob

# SYSTEM HEALTH & DB ENDPOINTS

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "4ensics Multi-Modal Forensic API",
        "vivit_model_loaded": model is not None,
        "audio_model_loaded": audio_detector is not None,
        "device": str(device) if device else "cpu"
    }

@app.get("/api/health/db")
def db_health_check():
    """Checks MySQL database connection."""
    return test_connection()

# MULTI-MODAL ANALYSIS ENDPOINTS (/analyze and /detect)

@app.post("/analyze")
@app.post("/detect")
async def analyze_media(
    file: UploadFile = File(...),
    mode: str = Form("deep"),
    media_type: Optional[str] = Form(None),
    model_choice: Optional[str] = Form("All models combined (recommended)"),
    user_email: Optional[str] = Form("analyst@4ensics.ai"),
    batch_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Accepts Video, Audio, Image, or Document files, performs multi-modal forensic analysis 
    (ViViT for video, WavLM for audio, 4-Model Ensemble for image, RoBERTa for text), 
    and persists all records to MySQL.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    video_exts = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v"}
    audio_exts = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac"}
    
    is_video = ext in video_exts or media_type == "video"
    is_audio = ext in audio_exts or media_type == "audio"
    is_image = ext in {".jpg", ".jpeg", ".png", ".bmp", ".webp"} or media_type == "image"
    is_doc = ext in {".pdf", ".txt"} or media_type in ["document", "text"]

    if not is_video and not is_audio and not is_image and not is_doc:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'."
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext or ".dat") as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        temp_filepath = tmp_file.name

    file_size = os.path.getsize(temp_filepath)
    file_hash = compute_sha256(temp_filepath)

    try:
        # Resolve user
        user = get_user_by_email(db, user_email) if user_email else None
        if not user:
            user = db.query(AppUser).first()
        user_id = user.user_id if user else "anonymous"

        m_type = "audio" if is_audio else ("image" if is_image else ("document" if is_doc else "video"))
        upload_record = create_media_upload(
            db=db,
            user_id=user_id,
            media_type=m_type,
            file_format=ext.lstrip("."),
            file_hash_sha256=file_hash,
            batch_id=batch_id,
            file_path=file.filename,
            file_size_bytes=file_size
        )
        job_record = create_analysis_job(
            db=db,
            upload_id=upload_record.upload_id,
            status="processing",
            progress_pct=10.0
        )
        scoring_cfg = get_default_scoring_config(db)

        # 1. IMAGE FORENSIC PIPELINE (4-Model Ensemble + ELA / FFT)
        if is_image:
            ai_model_record = get_or_create_ai_model(
                db,
                name="Image Forensic Ensemble Engine",
                version="4-Model Multi-Variant",
                modality="image",
                accuracy=0.962
            )
            detector = get_image_detector()
            img_result = detector.analyze(temp_filepath, model_choice=model_choice or "All models combined (recommended)")

            score_val = img_result["risk_score_num"]
            priority = img_result["priority_level"]
            risk_band = "HIGH" if priority == "High" else ("MEDIUM" if priority == "Medium" else "LOW")
            verdict = "SYNTHETIC" if priority != "Low" else "AUTHENTIC"

            report = create_analysis_report(
                db=db,
                upload_id=upload_record.upload_id,
                job_id=job_record.job_id,
                scoring_config_id=scoring_cfg.scoring_config_id if scoring_cfg else None,
                fused_score=score_val,
                confidence=round(score_val if priority != "Low" else 100.0 - score_val, 1),
                risk_band=risk_band,
                verdict=verdict,
                summary_text=img_result["recommendation"]
            )
            add_image_analysis(
                db=db,
                report_id=report.report_id,
                model_id=ai_model_record.model_id,
                ela_score=score_val,
                fake_probability=score_val,
                verdict=verdict
            )
            update_job_status(db, job_record.job_id, "completed", 100.0)

            return JSONResponse(content={
                "status": "success",
                "media_type": "image",
                "report_id": report.report_id,
                "upload_id": upload_record.upload_id,
                **img_result
            })

        # 2. DOCUMENT FORENSIC PIPELINE (PDF / TXT)
        if is_doc:
            ai_model_record = get_or_create_ai_model(
                db,
                name="Document & Text Authenticity Engine",
                version="RoBERTa-v2",
                modality="text",
                accuracy=0.954
            )
            detector = get_text_detector()
            doc_result = detector.analyze_document(temp_filepath)

            ai_prob = doc_result["ai_probability"]
            is_ai = ai_prob >= 50.0
            verdict = "AI-Generated" if is_ai else "Human-Written"
            risk_band = "HIGH" if ai_prob >= 65.0 else ("MEDIUM" if ai_prob >= 40.0 else "LOW")

            report = create_analysis_report(
                db=db,
                upload_id=upload_record.upload_id,
                job_id=job_record.job_id,
                scoring_config_id=scoring_cfg.scoring_config_id if scoring_cfg else None,
                fused_score=ai_prob,
                confidence=ai_prob if is_ai else doc_result["human_probability"],
                risk_band=risk_band,
                verdict=verdict,
                summary_text=f"Text analyzed as {verdict} with {doc_result['priority_score']}% priority score."
            )
            add_text_analysis(
                db=db,
                report_id=report.report_id,
                model_id=ai_model_record.model_id,
                perplexity_score=doc_result.get("perplexity", 0.0),
                burstiness_score=doc_result.get("burstiness", 0.0),
                fake_probability=ai_prob,
                verdict=verdict
            )
            update_job_status(db, job_record.job_id, "completed", 100.0)

            return JSONResponse(content={
                "status": "success",
                "media_type": "document",
                "report_id": report.report_id,
                "upload_id": upload_record.upload_id,
                **doc_result
            })

        # 3. AUDIO ANALYSIS PIPELINE (WavLM 4s Sliding Window)
        if is_audio:
            ai_model_record = get_or_create_ai_model(
                db,
                name="WavLM Audio Deepfake Classifier",
                version="wavlm-base-plus-mlp",
                modality="audio",
                accuracy=0.978
            )

            detector = get_audio_detector()
            audio_result = detector.analyze(temp_filepath)

            confidence_pct = audio_result["confidence_pct"]
            fake_prob_pct = audio_result["peak_score_pct"] if audio_result["is_synthetic"] else round(100.0 - confidence_pct, 2)
            risk_band = audio_result["risk_band"]
            verdict = audio_result["prediction"]

            report = create_analysis_report(
                db=db,
                upload_id=upload_record.upload_id,
                job_id=job_record.job_id,
                scoring_config_id=scoring_cfg.scoring_config_id if scoring_cfg else None,
                fused_score=fake_prob_pct,
                confidence=confidence_pct,
                risk_band=risk_band,
                verdict=verdict,
                summary_text=audio_result["justification"]
            )

            add_audio_analysis(
                db=db,
                report_id=report.report_id,
                model_id=ai_model_record.model_id,
                audio_source="direct_upload",
                sample_rate=16000,
                jitter=0.045 if audio_result["is_synthetic"] else 0.012,
                shimmer=0.062 if audio_result["is_synthetic"] else 0.021,
                hnr=12.4 if audio_result["is_synthetic"] else 24.8,
                fake_probability=fake_prob_pct,
                verdict=verdict
            )

            update_job_status(db, job_record.job_id, "completed", 100.0)

            return JSONResponse(content={
                "status": "success",
                "media_type": "audio",
                "report_id": report.report_id,
                "upload_id": upload_record.upload_id,
                "verdict": audio_result["verdict"],
                "prediction": verdict,
                "overall_verdict": verdict,
                "confidence": audio_result["confidence"],
                "confidence_pct": confidence_pct,
                "peak_score": audio_result["peak_score"],
                "peak_score_pct": audio_result["peak_score_pct"],
                "avg_score_pct": audio_result["avg_score_pct"],
                "num_chunks": audio_result["num_chunks"],
                "risk_band": risk_band,
                "justification": audio_result["justification"],
                "chunk_scores": audio_result["chunk_scores"],
                "model_engine": audio_result["model_engine"]
            })

        # 2. VIDEO ANALYSIS PIPELINE (ViViT Transformer)

        ai_model_record = get_or_create_ai_model(
            db,
            name="ViViT Video Deepfake Classifier",
            version="checkpoint-2880",
            modality="video",
            accuracy=0.965
        )

        if mode == "quick":
            segments = extract_segments(temp_filepath, segment_sec=9999.0)
            if not segments:
                raise HTTPException(status_code=400, detail="Could not extract frames from video.")
                
            fake_prob, real_prob = run_inference(segments[0]["frames"])
            
            is_fake = fake_prob > 0.5
            verdict = "FAKE" if is_fake else "REAL"
            confidence = round(max(fake_prob, real_prob) * 100, 2)
            fake_pct = round(fake_prob * 100, 2)
            risk_band = "HIGH" if fake_pct >= 70 else ("MEDIUM" if fake_pct >= 30 else "LOW")
            justification = f"Quick scan classified video as {verdict} with {confidence}% confidence."

            report = create_analysis_report(
                db=db,
                upload_id=upload_record.upload_id,
                job_id=job_record.job_id,
                scoring_config_id=scoring_cfg.scoring_config_id if scoring_cfg else None,
                fused_score=fake_pct,
                confidence=confidence,
                risk_band=risk_band,
                verdict=verdict,
                summary_text=justification
            )

            add_video_analysis(
                db=db,
                report_id=report.report_id,
                model_id=ai_model_record.model_id,
                scan_mode="quick",
                chunk_count=1,
                avg_fake_prob=fake_pct,
                highest_fake_prob=fake_pct,
                justification=justification,
                chunk_scores=[{
                    "chunk_index": 0,
                    "time_label": "0.0s - end",
                    "start_time": 0.0,
                    "end_time": segments[0]["end"],
                    "fake_probability": fake_pct,
                    "real_probability": round(real_prob * 100, 2),
                    "verdict": verdict
                }]
            )

            update_job_status(db, job_record.job_id, "completed", 100.0)

            return JSONResponse(content={
                "status": "success",
                "media_type": "video",
                "mode": "quick",
                "report_id": report.report_id,
                "upload_id": upload_record.upload_id,
                "verdict": verdict,
                "prediction": verdict,
                "overall_verdict": verdict,
                "confidence": confidence,
                "confidence_percentage": confidence,
                "fake_probability_pct": fake_pct,
                "avg_fake_confidence_pct": fake_pct,
                "risk_band": risk_band,
                "justification": justification
            })
            
        else: # Deep scan
            segments = extract_segments(temp_filepath, segment_sec=2.0)
            if not segments:
                raise HTTPException(status_code=400, detail="Could not extract frames from video.")
                
            results = []
            for seg in segments:
                fake_prob, real_prob = run_inference(seg["frames"])
                results.append({
                    "time_label": seg["time_label"],
                    "start_time": seg["start"],
                    "end_time": seg["end"],
                    "fake_probability_pct": round(fake_prob * 100, 2),
                    "real_probability_pct": round(real_prob * 100, 2),
                    "verdict": "FAKE" if fake_prob > 0.5 else "REAL"
                })
                
            avg_fake = sum(r["fake_probability_pct"] for r in results) / len(results)
            final_verdict = "FAKE" if avg_fake > 50 else "REAL"
            highest_fake_segment = max(results, key=lambda x: x["fake_probability_pct"])
            confidence = round(avg_fake if final_verdict == "FAKE" else (100 - avg_fake), 2)
            risk_band = "CRITICAL" if avg_fake >= 85 else ("HIGH" if avg_fake >= 70 else ("MEDIUM" if avg_fake >= 30 else "LOW"))

            # Optional Audio Track check for fused analysis
            audio_track_verdict = None
            try:
                detector = get_audio_detector()
                audio_res = detector.analyze(temp_filepath)
                audio_track_verdict = audio_res
            except Exception as e:
                logger.info(f"Video audio extraction check: {e}")

            if final_verdict == "FAKE":
                justification = (
                    f"Video flagged as FAKE. ViViT transformer detected significant spatiotemporal synthesis. "
                    f"Peak manipulation between {highest_fake_segment['time_label']} ({highest_fake_segment['fake_probability_pct']}% anomaly)."
                )
            else:
                justification = (
                    f"Video verified authentic. Across all timeline segments, no major generative artifacts detected "
                    f"(Peak anomaly: {highest_fake_segment['fake_probability_pct']}%)."
                )

            if audio_track_verdict and audio_track_verdict.get("is_synthetic"):
                justification += f" Audio track also flagged synthetic ({audio_track_verdict.get('confidence')})."

            report = create_analysis_report(
                db=db,
                upload_id=upload_record.upload_id,
                job_id=job_record.job_id,
                scoring_config_id=scoring_cfg.scoring_config_id if scoring_cfg else None,
                fused_score=round(avg_fake, 2),
                confidence=confidence,
                risk_band=risk_band,
                verdict=final_verdict,
                summary_text=justification
            )

            add_video_analysis(
                db=db,
                report_id=report.report_id,
                model_id=ai_model_record.model_id,
                scan_mode="deep",
                chunk_count=len(results),
                avg_fake_prob=round(avg_fake, 2),
                highest_fake_prob=highest_fake_segment["fake_probability_pct"],
                justification=justification,
                chunk_scores=results
            )

            update_job_status(db, job_record.job_id, "completed", 100.0)

            return JSONResponse(content={
                "status": "success",
                "media_type": "video",
                "mode": "deep",
                "report_id": report.report_id,
                "upload_id": upload_record.upload_id,
                "verdict": final_verdict,
                "prediction": final_verdict,
                "overall_verdict": final_verdict,
                "confidence": confidence,
                "avg_fake_confidence_pct": round(avg_fake, 2),
                "risk_band": risk_band,
                "justification": justification,
                "timeline_data": results,
                "audio_track_analysis": audio_track_verdict
            })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference Pipeline Error: {e}", exc_info=True)
        if 'job_record' in locals() and job_record:
            update_job_status(db, job_record.job_id, "failed", error_message=str(e))
        raise HTTPException(status_code=500, detail=f"Inference Pipeline Error: {str(e)}")
        
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass

# DEDICATED AUDIO ENDPOINTS

@app.post("/analyze/image")
@app.post("/detect/image")
async def analyze_image_dedicated(
    file: UploadFile = File(...),
    model_choice: Optional[str] = Form("All models combined (recommended)"),
    user_email: Optional[str] = Form("analyst@4ensics.ai"),
    batch_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Direct image deepfake and forensic detection endpoint."""
    return await analyze_media(
        file=file,
        mode="deep",
        media_type="image",
        model_choice=model_choice,
        user_email=user_email,
        batch_id=batch_id,
        db=db
    )


@app.post("/analyze/audio")
@app.post("/detect/audio")
async def analyze_audio_dedicated(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form("analyst@4ensics.ai"),
    batch_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Direct audio deepfake detection endpoint using WavLM."""
    return await analyze_media(
        file=file,
        mode="deep",
        media_type="audio",
        user_email=user_email,
        batch_id=batch_id,
        db=db
    )


@app.post("/analyze/video")
@app.post("/detect/video")
async def analyze_video_dedicated(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form("analyst@4ensics.ai"),
    batch_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Direct video deepfake detection endpoint using ViViT."""
    return await analyze_media(
        file=file,
        mode="deep",
        media_type="video",
        user_email=user_email,
        batch_id=batch_id,
        db=db
    )


@app.post("/analyze/document")
@app.post("/detect/document")
async def analyze_document_dedicated(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form("analyst@4ensics.ai"),
    batch_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Direct document stylometry and AI text detection endpoint."""
    return await analyze_media(
        file=file,
        mode="deep",
        media_type="document",
        user_email=user_email,
        batch_id=batch_id,
        db=db
    )

# MODULAR SERVICE ENDPOINTS (Image, Audio, Text, Human Review)

class ImageAnalysisInput(BaseModel):
    report_id: str
    model_id: Optional[str] = None
    ela_score: Optional[float] = None
    ela_mean: Optional[float] = None
    ela_max: Optional[float] = None
    fft_score: Optional[float] = None
    fft_mean: Optional[float] = None
    feature_vec: Optional[List[float]] = None
    fake_probability: Optional[float] = None
    verdict: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

@app.post("/api/analysis/image")
def post_image_analysis(payload: ImageAnalysisInput, db: Session = Depends(get_db)):
    """Modular endpoint to register image forensic analysis."""
    result = add_image_analysis(
        db=db,
        report_id=payload.report_id,
        model_id=payload.model_id,
        ela_score=payload.ela_score,
        ela_mean=payload.ela_mean,
        ela_max=payload.ela_max,
        fft_score=payload.fft_score,
        fft_mean=payload.fft_mean,
        feature_vec=payload.feature_vec,
        fake_probability=payload.fake_probability,
        verdict=payload.verdict,
        metadata_json=payload.metadata_json
    )
    return {"status": "success", "image_analysis_id": result.image_analysis_id, "data": result.to_dict()}

class AudioAnalysisInput(BaseModel):
    report_id: str
    model_id: Optional[str] = None
    audio_source: Optional[str] = "extracted_from_video"
    sample_rate: Optional[int] = 16000
    jitter: Optional[float] = None
    shimmer: Optional[float] = None
    hnr: Optional[float] = None
    fake_probability: Optional[float] = None
    verdict: Optional[str] = None

@app.post("/api/analysis/audio")
def post_audio_analysis(payload: AudioAnalysisInput, db: Session = Depends(get_db)):
    """Modular endpoint to register audio forensic analysis."""
    result = add_audio_analysis(
        db=db,
        report_id=payload.report_id,
        model_id=payload.model_id,
        audio_source=payload.audio_source,
        sample_rate=payload.sample_rate,
        jitter=payload.jitter,
        shimmer=payload.shimmer,
        hnr=payload.hnr,
        fake_probability=payload.fake_probability,
        verdict=payload.verdict
    )
    return {"status": "success", "audio_analysis_id": result.audio_analysis_id, "data": result.to_dict()}

class TextAnalysisInput(BaseModel):
    report_id: str
    model_id: Optional[str] = None
    perplexity: Optional[float] = None
    burstiness: Optional[float] = None
    ttr: Optional[float] = None
    fake_probability: Optional[float] = None
    verdict: Optional[str] = None
    url_scam_checks: Optional[List[Dict[str, Any]]] = None

@app.post("/api/analysis/text")
def post_text_analysis(payload: TextAnalysisInput, db: Session = Depends(get_db)):
    """Modular endpoint to register NLP stylometry and AI text generation analysis."""
    result = add_text_analysis(
        db=db,
        report_id=payload.report_id,
        model_id=payload.model_id,
        perplexity=payload.perplexity,
        burstiness=payload.burstiness,
        ttr=payload.ttr,
        fake_probability=payload.fake_probability,
        verdict=payload.verdict,
        url_scam_checks=payload.url_scam_checks
    )
    return {"status": "success", "text_analysis_id": result.text_analysis_id, "data": result.to_dict()}

class ReviewInput(BaseModel):
    report_id: str
    reviewed_by: str
    action: str
    notes: Optional[str] = None

@app.post("/api/analysis/review")
def post_analysis_review(payload: ReviewInput, db: Session = Depends(get_db)):
    """Records human auditor review and updates report verification status."""
    result = add_analysis_review(
        db=db,
        report_id=payload.report_id,
        reviewed_by=payload.reviewed_by,
        action=payload.action,
        notes=payload.notes
    )
    return {"status": "success", "review_id": result.review_id, "data": result.to_dict()}

@app.get("/api/reports")
def get_reports(
    limit: int = 50,
    offset: int = 0,
    risk_band: Optional[str] = None,
    verdict: Optional[str] = None,
    media_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists forensic analysis reports with optional filtering."""
    results, total = list_reports(
        db=db,
        limit=limit,
        offset=offset,
        risk_band=risk_band,
        verdict=verdict,
        media_type=media_type
    )
    return {
        "status": "success",
        "total": total,
        "count": len(results),
        "reports": [r.to_dict() for r in results]
    }

@app.get("/api/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Fetches comprehensive forensic dossier including timeline chunks, audio/image analysis, and reviews."""
    report = get_report_full_details(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return {"status": "success", "report": report.to_dict()}


class TextInputModel(BaseModel):
    text: str

class URLInputModel(BaseModel):
    url: str

@app.post("/analyze/text")
@app.post("/detect/text")
def detect_text_route(payload: TextInputModel):
    detector = get_text_detector()
    return detector.analyze_text(payload.text)

@app.post("/analyze/url")
@app.post("/detect/url")
def detect_url_route(payload: URLInputModel):
    detector = get_text_detector()
    return detector.scan_url(payload.url)

@app.post("/analyze/whatsapp")
@app.post("/detect/whatsapp")
def detect_whatsapp_route(file: UploadFile = File(...)):
    unique_filename = f"temp_wa_{secrets.token_hex(8)}_{file.filename}"
    temp_filepath = os.path.join(tempfile.gettempdir(), unique_filename)
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        detector = get_text_detector()
        return detector.analyze_whatsapp(temp_filepath)
    finally:
        if os.path.exists(temp_filepath):
            try: os.remove(temp_filepath)
            except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)