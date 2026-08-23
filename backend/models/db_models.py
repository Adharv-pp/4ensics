import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Integer,
    BigInteger, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

# 1. AppUser
class AppUser(Base):
    __tablename__ = "app_user"

    user_id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="analyst")
    status = Column(String(50), nullable=False, default="active", index=True)
    email_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    email_verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    scan_batches = relationship("ScanBatch", back_populates="user", cascade="all, delete-orphan")
    media_uploads = relationship("MediaUpload", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("AnalysisReview", back_populates="reviewer")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# 2. UserSession
class UserSession(Base):
    __tablename__ = "user_session"

    session_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("app_user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="sessions")

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "revoked": self.revoked,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 3. PasswordResetToken
class PasswordResetToken(Base):
    __tablename__ = "password_reset_token"

    token_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("app_user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    used = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="password_reset_tokens")

    def to_dict(self):
        return {
            "token_id": self.token_id,
            "user_id": self.user_id,
            "used": self.used,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 4. EmailVerificationToken
class EmailVerificationToken(Base):
    __tablename__ = "email_verification_token"

    token_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("app_user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="email_verification_tokens")

    def to_dict(self):
        return {
            "token_id": self.token_id,
            "user_id": self.user_id,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 5. ScanBatch
class ScanBatch(Base):
    __tablename__ = "scan_batch"

    batch_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("app_user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    reference_label = Column(String(255), nullable=True)
    analysis_profile = Column(String(100), nullable=False, default="standard")
    priority = Column(String(50), nullable=False, default="normal")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="scan_batches")
    media_uploads = relationship("MediaUpload", back_populates="batch")

    def to_dict(self):
        return {
            "batch_id": self.batch_id,
            "user_id": self.user_id,
            "reference_label": self.reference_label,
            "analysis_profile": self.analysis_profile,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 6. MediaUpload
class MediaUpload(Base):
    __tablename__ = "media_upload"

    upload_id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("app_user.user_id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("scan_batch.batch_id", ondelete="SET NULL"), nullable=True, index=True)
    media_type = Column(String(50), nullable=False) # 'video', 'image', 'audio', 'text'
    file_format = Column(String(50), nullable=False)
    file_hash_sha256 = Column(String(64), nullable=False, index=True)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    retention_status = Column(String(50), nullable=False, default="active")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="media_uploads")
    batch = relationship("ScanBatch", back_populates="media_uploads")
    analysis_jobs = relationship("AnalysisJob", back_populates="upload", cascade="all, delete-orphan")
    analysis_reports = relationship("AnalysisReport", back_populates="upload", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "upload_id": self.upload_id,
            "user_id": self.user_id,
            "batch_id": self.batch_id,
            "media_type": self.media_type,
            "file_format": self.file_format,
            "file_hash_sha256": self.file_hash_sha256,
            "file_path": self.file_path,
            "file_size_bytes": self.file_size_bytes,
            "retention_status": self.retention_status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 7. AnalysisJob
class AnalysisJob(Base):
    __tablename__ = "analysis_job"

    job_id = Column(String(36), primary_key=True, default=generate_uuid)
    upload_id = Column(String(36), ForeignKey("media_upload.upload_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True) # pending, processing, completed, failed
    progress_pct = Column(Float, nullable=False, default=0.0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    upload = relationship("MediaUpload", back_populates="analysis_jobs")
    reports = relationship("AnalysisReport", back_populates="job")

    def to_dict(self):
        return {
            "job_id": self.job_id,
            "upload_id": self.upload_id,
            "status": self.status,
            "progress_pct": self.progress_pct,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 8. AIModel
class AIModel(Base):
    __tablename__ = "ai_model"

    model_id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    modality = Column(String(50), nullable=False, index=True) # video, image, audio, text, multimodal
    accuracy = Column(Float, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships to analyses
    video_analyses = relationship("VideoAnalysis", back_populates="model")
    image_analyses = relationship("ImageAnalysis", back_populates="model")
    audio_analyses = relationship("AudioAnalysis", back_populates="model")
    text_analyses = relationship("TextAnalysis", back_populates="model")

    def to_dict(self):
        return {
            "model_id": self.model_id,
            "name": self.name,
            "version": self.version,
            "modality": self.modality,
            "accuracy": self.accuracy,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 9. ScoringConfig
class ScoringConfig(Base):
    __tablename__ = "scoring_config"

    scoring_config_id = Column(String(36), primary_key=True, default=generate_uuid)
    low_max = Column(Float, nullable=False, default=30.0)
    medium_max = Column(Float, nullable=False, default=70.0)
    module_weights_json = Column(JSON, nullable=False) # e.g. {"video": 0.4, "audio": 0.3, "image": 0.2, "text": 0.1}
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    reports = relationship("AnalysisReport", back_populates="scoring_config")

    def to_dict(self):
        return {
            "scoring_config_id": self.scoring_config_id,
            "low_max": self.low_max,
            "medium_max": self.medium_max,
            "module_weights_json": self.module_weights_json,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 10. AnalysisReport
class AnalysisReport(Base):
    __tablename__ = "analysis_report"

    report_id = Column(String(36), primary_key=True, default=generate_uuid)
    upload_id = Column(String(36), ForeignKey("media_upload.upload_id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("analysis_job.job_id", ondelete="SET NULL"), nullable=True, index=True)
    scoring_config_id = Column(String(36), ForeignKey("scoring_config.scoring_config_id", ondelete="SET NULL"), nullable=True, index=True)
    fused_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_band = Column(String(50), nullable=False, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    verdict = Column(String(50), nullable=False, index=True) # REAL, FAKE, SUSPICIOUS, INCONCLUSIVE
    review_status = Column(String(50), nullable=False, default="unreviewed") # unreviewed, under_review, verified, dismissed
    summary_text = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    upload = relationship("MediaUpload", back_populates="analysis_reports")
    job = relationship("AnalysisJob", back_populates="reports")
    scoring_config = relationship("ScoringConfig", back_populates="reports")

    image_analyses = relationship("ImageAnalysis", back_populates="report", cascade="all, delete-orphan")
    video_analyses = relationship("VideoAnalysis", back_populates="report", cascade="all, delete-orphan")
    audio_analyses = relationship("AudioAnalysis", back_populates="report", cascade="all, delete-orphan")
    text_analyses = relationship("TextAnalysis", back_populates="report", cascade="all, delete-orphan")
    reviews = relationship("AnalysisReview", back_populates="report", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "report_id": self.report_id,
            "upload_id": self.upload_id,
            "job_id": self.job_id,
            "scoring_config_id": self.scoring_config_id,
            "fused_score": self.fused_score,
            "confidence": self.confidence,
            "risk_band": self.risk_band,
            "verdict": self.verdict,
            "review_status": self.review_status,
            "summary_text": self.summary_text,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 11. ImageAnalysis
class ImageAnalysis(Base):
    __tablename__ = "image_analysis"

    image_analysis_id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("analysis_report.report_id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(36), ForeignKey("ai_model.model_id", ondelete="SET NULL"), nullable=True, index=True)
    ela_score = Column(Float, nullable=True)
    ela_mean = Column(Float, nullable=True)
    ela_max = Column(Float, nullable=True)
    fft_score = Column(Float, nullable=True)
    fft_mean = Column(Float, nullable=True)
    feature_vec_json = Column(JSON, nullable=True) # 8-feature forensic vector
    fake_probability = Column(Float, nullable=True)
    verdict = Column(String(50), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("AnalysisReport", back_populates="image_analyses")
    model = relationship("AIModel", back_populates="image_analyses")

    def to_dict(self):
        return {
            "image_analysis_id": self.image_analysis_id,
            "report_id": self.report_id,
            "model_id": self.model_id,
            "ela_score": self.ela_score,
            "ela_mean": self.ela_mean,
            "ela_max": self.ela_max,
            "fft_score": self.fft_score,
            "fft_mean": self.fft_mean,
            "feature_vec_json": self.feature_vec_json,
            "fake_probability": self.fake_probability,
            "verdict": self.verdict,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 12. VideoAnalysis
class VideoAnalysis(Base):
    __tablename__ = "video_analysis"

    video_analysis_id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("analysis_report.report_id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(36), ForeignKey("ai_model.model_id", ondelete="SET NULL"), nullable=True, index=True)
    scan_mode = Column(String(50), nullable=False, default="deep") # quick, deep
    chunk_count = Column(Integer, nullable=False, default=0)
    avg_fake_prob = Column(Float, nullable=True)
    highest_fake_prob = Column(Float, nullable=True)
    justification = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("AnalysisReport", back_populates="video_analyses")
    model = relationship("AIModel", back_populates="video_analyses")
    chunks = relationship("VideoChunkScore", back_populates="video_analysis", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "video_analysis_id": self.video_analysis_id,
            "report_id": self.report_id,
            "model_id": self.model_id,
            "scan_mode": self.scan_mode,
            "chunk_count": self.chunk_count,
            "avg_fake_prob": self.avg_fake_prob,
            "highest_fake_prob": self.highest_fake_prob,
            "justification": self.justification,
            "chunks": [c.to_dict() for c in self.chunks] if self.chunks else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 13. VideoChunkScore
class VideoChunkScore(Base):
    __tablename__ = "video_chunk_score"

    chunk_id = Column(String(36), primary_key=True, default=generate_uuid)
    video_analysis_id = Column(String(36), ForeignKey("video_analysis.video_analysis_id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False, index=True)
    time_label = Column(String(50), nullable=True)
    start_time = Column(Float, nullable=True)
    end_time = Column(Float, nullable=True)
    fake_probability = Column(Float, nullable=False)
    real_probability = Column(Float, nullable=True)
    verdict = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    video_analysis = relationship("VideoAnalysis", back_populates="chunks")

    def to_dict(self):
        return {
            "chunk_id": self.chunk_id,
            "video_analysis_id": self.video_analysis_id,
            "chunk_index": self.chunk_index,
            "time_label": self.time_label,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "fake_probability": self.fake_probability,
            "real_probability": self.real_probability,
            "verdict": self.verdict,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 14. AudioAnalysis
class AudioAnalysis(Base):
    __tablename__ = "audio_analysis"

    audio_analysis_id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("analysis_report.report_id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(36), ForeignKey("ai_model.model_id", ondelete="SET NULL"), nullable=True, index=True)
    audio_source = Column(String(100), nullable=True) # 'extracted_from_video', 'standalone_wav', 'mic'
    sample_rate = Column(Integer, nullable=True)
    jitter = Column(Float, nullable=True)
    shimmer = Column(Float, nullable=True)
    hnr = Column(Float, nullable=True) # Harmonics-to-Noise Ratio
    fake_probability = Column(Float, nullable=True)
    verdict = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("AnalysisReport", back_populates="audio_analyses")
    model = relationship("AIModel", back_populates="audio_analyses")

    def to_dict(self):
        return {
            "audio_analysis_id": self.audio_analysis_id,
            "report_id": self.report_id,
            "model_id": self.model_id,
            "audio_source": self.audio_source,
            "sample_rate": self.sample_rate,
            "jitter": self.jitter,
            "shimmer": self.shimmer,
            "hnr": self.hnr,
            "fake_probability": self.fake_probability,
            "verdict": self.verdict,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 15. TextAnalysis
class TextAnalysis(Base):
    __tablename__ = "text_analysis"

    text_analysis_id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("analysis_report.report_id", ondelete="CASCADE"), nullable=False, index=True)
    model_id = Column(String(36), ForeignKey("ai_model.model_id", ondelete="SET NULL"), nullable=True, index=True)
    perplexity = Column(Float, nullable=True)
    burstiness = Column(Float, nullable=True)
    ttr = Column(Float, nullable=True) # Type-Token Ratio
    fake_probability = Column(Float, nullable=True)
    verdict = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("AnalysisReport", back_populates="text_analyses")
    model = relationship("AIModel", back_populates="text_analyses")
    url_checks = relationship("URLScamCheck", back_populates="text_analysis", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "text_analysis_id": self.text_analysis_id,
            "report_id": self.report_id,
            "model_id": self.model_id,
            "perplexity": self.perplexity,
            "burstiness": self.burstiness,
            "ttr": self.ttr,
            "fake_probability": self.fake_probability,
            "verdict": self.verdict,
            "url_checks": [u.to_dict() for u in self.url_checks] if self.url_checks else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 16. URLScamCheck
class URLScamCheck(Base):
    __tablename__ = "url_scam_check"

    url_check_id = Column(String(36), primary_key=True, default=generate_uuid)
    text_analysis_id = Column(String(36), ForeignKey("text_analysis.text_analysis_id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    is_flagged = Column(Boolean, nullable=False, default=False)
    threat_category = Column(String(100), nullable=True) # phishing, malware, scam, safe
    reputation_score = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    text_analysis = relationship("TextAnalysis", back_populates="url_checks")

    def to_dict(self):
        return {
            "url_check_id": self.url_check_id,
            "text_analysis_id": self.text_analysis_id,
            "url": self.url,
            "is_flagged": self.is_flagged,
            "threat_category": self.threat_category,
            "reputation_score": self.reputation_score,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# 17. AnalysisReview
class AnalysisReview(Base):
    __tablename__ = "analysis_review"

    review_id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("analysis_report.report_id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_by = Column(String(36), ForeignKey("app_user.user_id", ondelete="RESTRICT"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # CONFIRMED_FAKE, CONFIRMED_REAL, ESCALATED, DISMISSED
    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    report = relationship("AnalysisReport", back_populates="reviews")
    reviewer = relationship("AppUser", back_populates="reviews")

    def to_dict(self):
        return {
            "review_id": self.review_id,
            "report_id": self.report_id,
            "reviewed_by": self.reviewed_by,
            "action": self.action,
            "notes": self.notes,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None
        }
