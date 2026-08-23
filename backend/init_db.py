import hashlib
import logging
from database import ensure_database_exists, engine, SessionLocal, Base
from models import (
    AppUser, AIModel, ScoringConfig, ScanBatch, MediaUpload,
    AnalysisJob, AnalysisReport, ImageAnalysis, VideoAnalysis,
    VideoChunkScore, AudioAnalysis, TextAnalysis, URLScamCheck,
    AnalysisReview, UserSession, PasswordResetToken, EmailVerificationToken
)
from services.forensic_service import add_user, add_ai_model, create_scoring_config

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("DB_Initializer")

def hash_password(password: str) -> str:
    """Simple SHA-256 password hasher for seeding."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def initialize_database():
    """Ensures database exists, creates all 17 tables, and seeds initial data."""
    logger.info("Step 1: Checking and creating MySQL database if not exists...")
    ensure_database_exists()

    logger.info("Step 2: Creating all tables from SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully.")

    logger.info("Step 3: Seeding initial baseline data...")
    db = SessionLocal()
    try:
        # 1. Seed Default AI Models
        models_data = [
            {
                "name": "ViViT Video Deepfake Classifier",
                "version": "checkpoint-2880",
                "modality": "video",
                "accuracy": 0.965
            },
            {
                "name": "ELA & FFT Forensic Image Analyzer",
                "version": "v1.2.0",
                "modality": "image",
                "accuracy": 0.942
            },
            {
                "name": "Wav2Vec2 Synthetic Audio Detector",
                "version": "v1.0.0",
                "modality": "audio",
                "accuracy": 0.928
            },
            {
                "name": "RoBERTa AI-Generated Text Detector",
                "version": "v2.1.0",
                "modality": "text",
                "accuracy": 0.951
            }
        ]

        for m_data in models_data:
            existing = db.query(AIModel).filter(
                AIModel.name == m_data["name"],
                AIModel.version == m_data["version"]
            ).first()
            if not existing:
                add_ai_model(
                    db,
                    name=m_data["name"],
                    version=m_data["version"],
                    modality=m_data["modality"],
                    accuracy=m_data["accuracy"]
                )
                logger.info(f"Seeded AI Model: {m_data['name']} ({m_data['version']})")

        # 2. Seed Default Scoring Config
        existing_cfg = db.query(ScoringConfig).filter(ScoringConfig.is_default == True).first()
        if not existing_cfg:
            create_scoring_config(
                db,
                low_max=30.0,
                medium_max=70.0,
                module_weights_json={
                    "video": 0.40,
                    "image": 0.25,
                    "audio": 0.20,
                    "text": 0.15
                },
                is_default=True
            )
            logger.info("Seeded default ScoringConfig (video: 40%, image: 25%, audio: 20%, text: 15%).")

        # 3. Seed Default Admin / Lead Analyst User
        default_users = [
            {
                "full_name": "Sridhar Lead Analyst",
                "email": "sridhar@4ensics.ai",
                "password": "Password@123",
                "role": "admin",
                "status": "active",
                "email_verified": True
            },
            {
                "full_name": "Forensic Investigator",
                "email": "analyst@4ensics.ai",
                "password": "Password@123",
                "role": "analyst",
                "status": "active",
                "email_verified": True
            }
        ]

        for u_data in default_users:
            existing_user = db.query(AppUser).filter(AppUser.email == u_data["email"]).first()
            if not existing_user:
                add_user(
                    db,
                    full_name=u_data["full_name"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    role=u_data["role"],
                    status=u_data["status"],
                    email_verified=u_data["email_verified"]
                )
                logger.info(f"Seeded User: {u_data['full_name']} ({u_data['email']})")

        db.commit()
        logger.info("Database initialization and seeding completed successfully!")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    initialize_database()
