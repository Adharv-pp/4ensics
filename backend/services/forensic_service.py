import os
import uuid
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from models import (
    AppUser, UserSession, PasswordResetToken, EmailVerificationToken,
    ScanBatch, MediaUpload, AnalysisJob, AIModel, ScoringConfig,
    AnalysisReport, ImageAnalysis, VideoAnalysis, VideoChunkScore,
    AudioAnalysis, TextAnalysis, URLScamCheck, AnalysisReview
)

logger = logging.getLogger("ForensicService")

# =========================================================================
# 1. USER & AUTH SERVICES
# =========================================================================

def hash_password(password: str) -> str:
    """Computes a SHA-256 hash for secure storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hashed password."""
    return hash_password(plain_password) == hashed_password

def add_user(
    db: Session,
    full_name: str,
    email: str,
    password_hash: str,
    role: str = "analyst",
    status: str = "active",
    email_verified: bool = False
) -> AppUser:
    """Creates a new user in the app_user table."""
    user = AppUser(
        full_name=full_name,
        email=email.strip().lower(),
        password_hash=password_hash,
        role=role,
        status=status,
        email_verified=email_verified
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_role(
    db: Session,
    user_id: str,
    role: str,
    status: Optional[str] = None,
    full_name: Optional[str] = None
) -> Optional[AppUser]:
    """Updates user role (and optional status/name) in app_user table."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    user.role = role.strip()
    if status:
        user.status = status.strip()
    if full_name:
        user.full_name = full_name.strip()
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: str) -> Tuple[bool, str]:
    """Deletes a user and related records cleanly from the database."""
    user = get_user_by_id(db, user_id)
    if not user:
        return False, f"User with ID '{user_id}' not found."
    
    try:
        # Clean up any analysis reviews associated with this reviewer if any
        db.query(AnalysisReview).filter(AnalysisReview.reviewed_by == user_id).delete(synchronize_session=False)
        db.delete(user)
        db.commit()
        return True, f"User '{user.full_name}' ({user.email}) successfully deleted."
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {user_id}: {e}")
        return False, f"Failed to delete user: {str(e)}"

def get_user_by_email(db: Session, email: str) -> Optional[AppUser]:
    return db.query(AppUser).filter(AppUser.email == email.strip().lower()).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[AppUser]:
    return db.query(AppUser).filter(AppUser.user_id == user_id).first()

def authenticate_user(db: Session, login_identifier: str, password: str) -> Optional[AppUser]:
    """
    Authenticates a user by email or badge identifier and verifies password.
    """
    clean_id = login_identifier.strip().lower()
    user = db.query(AppUser).filter(AppUser.email == clean_id).first()
    
    # Also support matching by badge ID/name if contained in full_name
    if not user:
        user = db.query(AppUser).filter(AppUser.full_name.ilike(f"%{clean_id}%")).first()

    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
        
    return user

def create_user_session(
    db: Session,
    user_id: str,
    refresh_token_hash: Optional[str] = None,
    expires_at: Optional[datetime] = None
) -> UserSession:
    """Creates an active session for the authenticated user."""
    if not refresh_token_hash:
        raw_token = secrets.token_urlsafe(32)
        refresh_token_hash = hash_password(raw_token)
    if not expires_at:
        expires_at = datetime.utcnow() + timedelta(days=7)

    session = UserSession(
        user_id=user_id,
        refresh_token_hash=refresh_token_hash,
        expires_at=expires_at,
        revoked=False
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def revoke_session(db: Session, session_id: str) -> bool:
    """Marks a user session as revoked for logout."""
    session = db.query(UserSession).filter(UserSession.session_id == session_id).first()
    if session:
        session.revoked = True
        db.commit()
        return True
    return False

def create_password_reset_request(db: Session, email: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generates a 6-digit verification reset code & security token for the given email.
    Returns (success, reset_code, message).
    """
    user = get_user_by_email(db, email)
    if not user:
        return False, None, "No agency account found with that email address."

    # Generate a readable 6-character hex reset code
    reset_code = f"RST-{secrets.token_hex(3).upper()}"
    token_hash = hash_password(reset_code)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    # Invalidate any prior active reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.used == False
    ).update({"used": True})

    # Create new reset token
    reset_token = PasswordResetToken(
        user_id=user.user_id,
        token_hash=token_hash,
        used=False,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)

    logger.info(f"Password reset token generated for user {user.email}: {reset_code}")
    return True, reset_code, "Password reset code generated successfully. Valid for 30 minutes."

def verify_reset_code(db: Session, email: str, reset_code: str) -> bool:
    """Validates if a reset code is valid, unexpired, and unused."""
    user = get_user_by_email(db, email)
    if not user:
        return False
        
    token_hash = hash_password(reset_code.strip().upper())
    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    return token is not None

def reset_password_with_code(db: Session, email: str, reset_code: str, new_password: str) -> Tuple[bool, str]:
    """
    Validates reset code and sets new password for user.
    """
    user = get_user_by_email(db, email)
    if not user:
        return False, "User not found."

    token_hash = hash_password(reset_code.strip().upper())
    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False
    ).first()

    if not token:
        return False, "Invalid or expired reset code."

    if token.expires_at < datetime.utcnow():
        return False, "Reset code has expired. Please request a new link."

    # Update password and invalidate token
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    token.used = True
    
    # Invalidate all prior sessions for security
    db.query(UserSession).filter(UserSession.user_id == user.user_id).update({"revoked": True})
    
    db.commit()
    return True, "Password has been successfully updated. Please sign in with your new password."

def request_access(
    db: Session,
    first_name: str,
    last_name: str,
    email: str,
    badge_id: str,
    agency: str,
    department: Optional[str] = None,
    title: Optional[str] = None,
    justification: Optional[str] = None
) -> Tuple[AppUser, str]:
    """Creates a user with pending/analyst status and stores request metadata."""
    existing = get_user_by_email(db, email)
    if existing:
        return existing, f"An account with email {email} already exists."

    full_name = f"{first_name} {last_name}".strip()
    # Default temporary initial password
    temp_pass = hash_password(f"Badge@{badge_id}")
    
    user = add_user(
        db=db,
        full_name=full_name,
        email=email,
        password_hash=temp_pass,
        role=title if title else "analyst",
        status="pending",
        email_verified=False
    )
    return user, "Access request registered successfully. Administrator review pending."


# =========================================================================
# 2. BATCH & MEDIA UPLOAD SERVICES
# =========================================================================

def create_scan_batch(
    db: Session,
    user_id: str,
    reference_label: Optional[str] = None,
    analysis_profile: str = "standard",
    priority: str = "normal"
) -> ScanBatch:
    """Creates a scan batch for grouping media uploads."""
    batch = ScanBatch(
        user_id=user_id,
        reference_label=reference_label,
        analysis_profile=analysis_profile,
        priority=priority
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

def create_media_upload(
    db: Session,
    user_id: str,
    media_type: str,
    file_format: str,
    file_hash_sha256: str,
    batch_id: Optional[str] = None,
    file_path: Optional[str] = None,
    file_size_bytes: Optional[int] = None,
    retention_status: str = "active"
) -> MediaUpload:
    """Records an uploaded media file in media_upload table."""
    upload = MediaUpload(
        user_id=user_id,
        batch_id=batch_id,
        media_type=media_type,
        file_format=file_format.lower().lstrip("."),
        file_hash_sha256=file_hash_sha256,
        file_path=file_path,
        file_size_bytes=file_size_bytes,
        retention_status=retention_status
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


# =========================================================================
# 3. ANALYSIS JOB & AI MODEL REGISTRY
# =========================================================================

def create_analysis_job(
    db: Session,
    upload_id: str,
    status: str = "pending",
    progress_pct: float = 0.0
) -> AnalysisJob:
    """Creates an analysis job tracking asynchronous pipeline progress."""
    job = AnalysisJob(
        upload_id=upload_id,
        status=status,
        progress_pct=progress_pct,
        started_at=datetime.utcnow() if status == "processing" else None
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def update_job_status(
    db: Session,
    job_id: str,
    status: str,
    progress_pct: Optional[float] = None,
    error_message: Optional[str] = None
) -> Optional[AnalysisJob]:
    """Updates an analysis job's status and progress."""
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        return None
    job.status = status
    if progress_pct is not None:
        job.progress_pct = progress_pct
    if error_message:
        job.error_message = error_message
    if status == "completed":
        job.completed_at = datetime.utcnow()
        job.progress_pct = 100.0
    elif status == "failed":
        job.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job

def add_ai_model(
    db: Session,
    name: str,
    version: str,
    modality: str,
    accuracy: Optional[float] = None,
    is_active: bool = True
) -> AIModel:
    """Registers an AI model in the ai_model table."""
    model = AIModel(
        name=name,
        version=version,
        modality=modality,
        accuracy=accuracy,
        is_active=is_active
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model

def get_or_create_ai_model(
    db: Session,
    name: str,
    version: str,
    modality: str,
    accuracy: Optional[float] = None
) -> AIModel:
    model = db.query(AIModel).filter(
        AIModel.name == name,
        AIModel.version == version
    ).first()
    if not model:
        model = add_ai_model(db, name, version, modality, accuracy)
    return model

def create_scoring_config(
    db: Session,
    low_max: float = 30.0,
    medium_max: float = 70.0,
    module_weights_json: Optional[Dict[str, float]] = None,
    is_default: bool = False
) -> ScoringConfig:
    """Creates a scoring configuration for risk band assessment."""
    if module_weights_json is None:
        module_weights_json = {"video": 0.40, "image": 0.25, "audio": 0.20, "text": 0.15}
    if is_default:
        # Reset any prior defaults
        db.query(ScoringConfig).filter(ScoringConfig.is_default == True).update({"is_default": False})
    config = ScoringConfig(
        low_max=low_max,
        medium_max=medium_max,
        module_weights_json=module_weights_json,
        is_default=is_default
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config

def get_default_scoring_config(db: Session) -> Optional[ScoringConfig]:
    config = db.query(ScoringConfig).filter(ScoringConfig.is_default == True).first()
    if not config:
        config = db.query(ScoringConfig).first()
    return config


# =========================================================================
# 4. ANALYSIS REPORT
# =========================================================================

def create_analysis_report(
    db: Session,
    upload_id: str,
    fused_score: float,
    confidence: float,
    risk_band: str,
    verdict: str,
    job_id: Optional[str] = None,
    scoring_config_id: Optional[str] = None,
    review_status: str = "unreviewed",
    summary_text: Optional[str] = None
) -> AnalysisReport:
    """Creates a unified forensic analysis report."""
    report = AnalysisReport(
        upload_id=upload_id,
        job_id=job_id,
        scoring_config_id=scoring_config_id,
        fused_score=fused_score,
        confidence=confidence,
        risk_band=risk_band.upper(),
        verdict=verdict.upper(),
        review_status=review_status,
        summary_text=summary_text
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# =========================================================================
# 5. MODULAR FORENSIC FEATURE FUNCTIONS
#    (Video, Image, Audio, Text + URL Scam Check)
# =========================================================================

# --- 5.1 VIDEO ANALYSIS ---
def add_video_analysis(
    db: Session,
    report_id: str,
    model_id: Optional[str] = None,
    scan_mode: str = "deep",
    chunk_count: int = 0,
    avg_fake_prob: Optional[float] = None,
    highest_fake_prob: Optional[float] = None,
    justification: Optional[str] = None,
    chunk_scores: Optional[List[Dict[str, Any]]] = None
) -> VideoAnalysis:
    """
    Stores video analysis results and associated chunk-level timeline scores.
    """
    v_analysis = VideoAnalysis(
        report_id=report_id,
        model_id=model_id,
        scan_mode=scan_mode,
        chunk_count=chunk_count or (len(chunk_scores) if chunk_scores else 0),
        avg_fake_prob=avg_fake_prob,
        highest_fake_prob=highest_fake_prob,
        justification=justification
    )
    db.add(v_analysis)
    db.flush() # Populate v_analysis.video_analysis_id

    if chunk_scores:
        for idx, chunk in enumerate(chunk_scores):
            chunk_record = VideoChunkScore(
                video_analysis_id=v_analysis.video_analysis_id,
                chunk_index=chunk.get("chunk_index", idx),
                time_label=chunk.get("time_label"),
                start_time=chunk.get("start_time") or chunk.get("start"),
                end_time=chunk.get("end_time") or chunk.get("end"),
                fake_probability=chunk.get("fake_probability_pct") or chunk.get("fake_probability", 0.0),
                real_probability=chunk.get("real_probability_pct") or chunk.get("real_probability"),
                verdict=chunk.get("verdict")
            )
            db.add(chunk_record)

    db.commit()
    db.refresh(v_analysis)
    return v_analysis


# --- 5.2 IMAGE ANALYSIS (Modular Function for Image Forensics) ---
def add_image_analysis(
    db: Session,
    report_id: str,
    model_id: Optional[str] = None,
    ela_score: Optional[float] = None,
    ela_mean: Optional[float] = None,
    ela_max: Optional[float] = None,
    fft_score: Optional[float] = None,
    fft_mean: Optional[float] = None,
    feature_vec: Optional[List[float]] = None, # 8-feature forensic vector
    fake_probability: Optional[float] = None,
    verdict: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None
) -> ImageAnalysis:
    """
    Modular function to insert image forensic analysis (ELA, FFT, 8-feature vector).
    Ready for future image model integration.
    """
    img_record = ImageAnalysis(
        report_id=report_id,
        model_id=model_id,
        ela_score=ela_score,
        ela_mean=ela_mean,
        ela_max=ela_max,
        fft_score=fft_score,
        fft_mean=fft_mean,
        feature_vec_json=feature_vec,
        fake_probability=fake_probability,
        verdict=verdict,
        metadata_json=metadata_json
    )
    db.add(img_record)
    db.commit()
    db.refresh(img_record)
    return img_record


# --- 5.3 AUDIO ANALYSIS (Modular Function for Audio Forensics) ---
def add_audio_analysis(
    db: Session,
    report_id: str,
    model_id: Optional[str] = None,
    audio_source: Optional[str] = "extracted_from_video",
    sample_rate: Optional[int] = 16000,
    jitter: Optional[float] = None,
    shimmer: Optional[float] = None,
    hnr: Optional[float] = None,
    fake_probability: Optional[float] = None,
    verdict: Optional[str] = None
) -> AudioAnalysis:
    """
    Modular function to insert audio forensic analysis (jitter, shimmer, HNR).
    Ready for future audio model integration.
    """
    audio_record = AudioAnalysis(
        report_id=report_id,
        model_id=model_id,
        audio_source=audio_source,
        sample_rate=sample_rate,
        jitter=jitter,
        shimmer=shimmer,
        hnr=hnr,
        fake_probability=fake_probability,
        verdict=verdict
    )
    db.add(audio_record)
    db.commit()
    db.refresh(audio_record)
    return audio_record


# --- 5.4 TEXT ANALYSIS & URL SCAM CHECK (Modular Function) ---
def add_text_analysis(
    db: Session,
    report_id: str,
    model_id: Optional[str] = None,
    perplexity: Optional[float] = None,
    burstiness: Optional[float] = None,
    ttr: Optional[float] = None,
    fake_probability: Optional[float] = None,
    verdict: Optional[str] = None,
    url_scam_checks: Optional[List[Dict[str, Any]]] = None
) -> TextAnalysis:
    """
    Modular function to insert text forensic analysis (perplexity, burstiness, TTR, URL scam checks).
    Ready for future text model integration.
    """
    text_record = TextAnalysis(
        report_id=report_id,
        model_id=model_id,
        perplexity=perplexity,
        burstiness=burstiness,
        ttr=ttr,
        fake_probability=fake_probability,
        verdict=verdict
    )
    db.add(text_record)
    db.flush()

    if url_scam_checks:
        for check in url_scam_checks:
            url_item = URLScamCheck(
                text_analysis_id=text_record.text_analysis_id,
                url=check.get("url", ""),
                is_flagged=check.get("is_flagged", False),
                threat_category=check.get("threat_category"),
                reputation_score=check.get("reputation_score")
            )
            db.add(url_item)

    db.commit()
    db.refresh(text_record)
    return text_record

def add_url_scam_check(
    db: Session,
    text_analysis_id: str,
    url: str,
    is_flagged: bool = False,
    threat_category: Optional[str] = None,
    reputation_score: Optional[float] = None
) -> URLScamCheck:
    """Adds a single URL scam check associated with a text analysis."""
    url_check = URLScamCheck(
        text_analysis_id=text_analysis_id,
        url=url,
        is_flagged=is_flagged,
        threat_category=threat_category,
        reputation_score=reputation_score
    )
    db.add(url_check)
    db.commit()
    db.refresh(url_check)
    return url_check


# =========================================================================
# 6. HUMAN AUDIT / REVIEW SERVICES
# =========================================================================

def add_analysis_review(
    db: Session,
    report_id: str,
    reviewed_by: str,
    action: str, # CONFIRMED_FAKE, CONFIRMED_REAL, ESCALATED, DISMISSED
    notes: Optional[str] = None
) -> AnalysisReview:
    """Records a human analyst review and updates the report's review_status."""
    review = AnalysisReview(
        report_id=report_id,
        reviewed_by=reviewed_by,
        action=action,
        notes=notes
    )
    db.add(review)
    
    # Update report status
    report = db.query(AnalysisReport).filter(AnalysisReport.report_id == report_id).first()
    if report:
        report.review_status = "verified" if action in ["CONFIRMED_FAKE", "CONFIRMED_REAL"] else action.lower()

    db.commit()
    db.refresh(review)
    return review


# =========================================================================
# 7. REPORT QUERIES & FULL DETAILS
# =========================================================================

def get_report_full_details(db: Session, report_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full nested report including all 4 module analyses, chunks, reviews, and upload info."""
    report = db.query(AnalysisReport).filter(AnalysisReport.report_id == report_id).first()
    if not report:
        return None

    data = report.to_dict()
    data["upload"] = report.upload.to_dict() if report.upload else None
    data["job"] = report.job.to_dict() if report.job else None
    data["scoring_config"] = report.scoring_config.to_dict() if report.scoring_config else None
    data["video_analyses"] = [v.to_dict() for v in report.video_analyses]
    data["image_analyses"] = [i.to_dict() for i in report.image_analyses]
    data["audio_analyses"] = [a.to_dict() for a in report.audio_analyses]
    data["text_analyses"] = [t.to_dict() for t in report.text_analyses]
    data["reviews"] = [r.to_dict() for r in report.reviews]
    return data

def list_reports(db: Session, limit: int = 50, offset: int = 0, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lists summary reports for dashboard."""
    query = db.query(AnalysisReport).join(MediaUpload)
    if user_id:
        query = query.filter(MediaUpload.user_id == user_id)
    reports = query.order_by(AnalysisReport.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for r in reports:
        item = r.to_dict()
        item["media_type"] = r.upload.media_type if r.upload else "unknown"
        item["file_format"] = r.upload.file_format if r.upload else ""
        results.append(item)
    return results
