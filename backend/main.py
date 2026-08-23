import os
import shutil
import uuid
import logging
import tempfile
import torch
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import VideoMAEImageProcessor, VivitForVideoClassification

from services.audio_detector import get_audio_detector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeepfakeBackend")

app = FastAPI(
    title="Deepfake Multi-Modal Detection API",
    description="Backend API for classifying video and audio media using fine-tuned ViViT and WavLM models.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

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

logger.info("Loading preprocessor and model weights...")
processor = None
model = None
device = None
audio_detector = None

try:
    processor = VideoMAEImageProcessor.from_pretrained("google/vivit-b-16x2-kinetics400")
    if os.path.exists(CHECKPOINT_DIR):
        model = VivitForVideoClassification.from_pretrained(CHECKPOINT_DIR)
        model.eval()  
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        logger.info(f"ViViT Model successfully loaded on device: {device}")
    else:
        logger.warning(f"Checkpoint dir {CHECKPOINT_DIR} not found.")
except Exception as e:
    logger.error(f"Error initializing ViViT model: {str(e)}")

try:
    audio_detector = get_audio_detector()
    logger.info("Audio Deepfake Detector loaded.")
except Exception as e:
    logger.error(f"Error initializing Audio detector: {str(e)}")

def extract_frames_opencv(video_path, num_frames=16):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file.")
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise ValueError("Video has zero or invalid frame count.")
        
    indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if not success:
            if len(frames) > 0:
                frames.append(frames[-1])
            continue
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(frame_rgb)
        
    cap.release()
    
    if len(frames) == 0:
        raise ValueError("Failed to extract any readable frames from the video.")
    while len(frames) < num_frames:
        frames.append(frames[-1])
        
    return np.array(frames[:num_frames])

@app.get("/")
@app.get("/health")
def read_root():
    return {
        "status": "online",
        "message": "Deepfake Multi-Modal Detection Backend is running.",
        "vivit_model_loaded": model is not None,
        "audio_model_loaded": audio_detector is not None,
        "device": str(device) if device else "none"
    }

@app.post("/analyze")
@app.post("/detect")
async def detect_media(
    file: UploadFile = File(...),
    mode: str = Form("deep")
):
    ext = os.path.splitext(file.filename)[1].lower()
    audio_exts = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac"}
    
    unique_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
    temp_filepath = os.path.join(tempfile.gettempdir(), unique_filename)
    
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Audio Pipeline
        if ext in audio_exts:
            detector = get_audio_detector()
            res = detector.analyze(temp_filepath)
            return res
            
        # Video Pipeline
        video_data = extract_frames_opencv(temp_filepath, num_frames=16)
        
        if model is None or processor is None:
            raise HTTPException(status_code=500, detail="ViViT AI Model is not loaded on server.")
            
        inputs = processor(list(video_data), return_tensors="pt")
        pixel_values = inputs['pixel_values'].squeeze(0).unsqueeze(0)
        
        current_device = next(model.parameters()).device
        pixel_values = pixel_values.to(current_device)
        
        with torch.no_grad():
            outputs = model(pixel_values=pixel_values)
            logits = outputs.logits
            
            prediction_idx = torch.argmax(logits, dim=-1).item()
            probabilities = torch.softmax(logits, dim=-1)[0]
            confidence = probabilities[prediction_idx].item()
            fake_prob = probabilities[1].item()
            
        label = "FAKE" if prediction_idx == 1 else "REAL"
        confidence_pct = round(confidence * 100, 2)
        fake_pct = round(fake_prob * 100, 2)
        
        return {
            "status": "success",
            "media_type": "video",
            "verdict": label,
            "prediction": label,
            "overall_verdict": label,
            "confidence": f"{confidence_pct}%",
            "confidence_percentage": confidence_pct,
            "avg_fake_confidence_pct": fake_pct,
            "raw_logits": logits.tolist()[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference Pipeline Error: {str(e)}")
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass

@app.post("/analyze/audio")
@app.post("/detect/audio")
async def detect_audio(file: UploadFile = File(...)):
    return await detect_media(file=file, mode="deep")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)