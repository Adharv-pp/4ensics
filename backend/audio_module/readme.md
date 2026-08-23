# Audio Deepfake Detection Module

## Setup
pip install torch torchaudio transformers moviepy gradio

## Run
python app_deepfake.py

Launches Gradio UI + auto API at http://127.0.0.1:7860
API docs available at http://127.0.0.1:7860/?view=api

## Input
Audio or video file (.mp4, .mov, .wav, .mp3, etc.)

## Output
Returns 4 fields:
- verdict (string): "🚨 SYNTHETIC / AI VOICE" or "✅ REAL HUMAN VOICE"
- confidence (string, e.g. "87.5%"): overall confidence in the verdict
- peak_score (string, e.g. "92.3%"): highest AI score found in any 
  single 4-second segment — useful for flagging localized fake content 
  even if overall confidence is lower
- num_chunks (string, e.g. "12"): number of 4-second segments the audio 
  was split into and analyzed

## How detection works
Audio is split into 4-second sliding-window chunks (50% overlap). Each 
chunk is scored independently via WavLM (layers 6+12) + MLP classifier. 
Final verdict combines average score and peak (max) score across all 
chunks — flags as synthetic if peak >= 35% OR average >= 25%.