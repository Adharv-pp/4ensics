import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from .db_models import (
        AppUser,
        UserSession,
        PasswordResetToken,
        EmailVerificationToken,
        ScanBatch,
        MediaUpload,
        AnalysisJob,
        AIModel,
        ScoringConfig,
        AnalysisReport,
        ImageAnalysis,
        VideoAnalysis,
        VideoChunkScore,
        AudioAnalysis,
        TextAnalysis,
        URLScamCheck,
        AnalysisReview
    )
except (ImportError, ModuleNotFoundError):
    from db_models import (
        AppUser,
        UserSession,
        PasswordResetToken,
        EmailVerificationToken,
        ScanBatch,
        MediaUpload,
        AnalysisJob,
        AIModel,
        ScoringConfig,
        AnalysisReport,
        ImageAnalysis,
        VideoAnalysis,
        VideoChunkScore,
        AudioAnalysis,
        TextAnalysis,
        URLScamCheck,
        AnalysisReview
    )

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
VIVIT_MODEL_DIR = os.path.join(MODELS_DIR, "vivit", "checkpoint-2880")
AUDIO_MODEL_PATH = os.path.join(MODELS_DIR, "audio", "wavlm_deepfake_head.pth")

__all__ = [
    "AppUser",
    "UserSession",
    "PasswordResetToken",
    "EmailVerificationToken",
    "ScanBatch",
    "MediaUpload",
    "AnalysisJob",
    "AIModel",
    "ScoringConfig",
    "AnalysisReport",
    "ImageAnalysis",
    "VideoAnalysis",
    "VideoChunkScore",
    "AudioAnalysis",
    "TextAnalysis",
    "URLScamCheck",
    "AnalysisReview",
    "MODELS_DIR",
    "VIVIT_MODEL_DIR",
    "AUDIO_MODEL_PATH"
]
