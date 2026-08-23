import os
import sys
import numpy as np
import torch
import torch.nn as nn
import torchaudio
from transformers import WavLMModel
try:
    from moviepy.editor import VideoFileClip
except ImportError:
    from moviepy import VideoFileClip
import gradio as gr

# -------------------------------------------------------------
# 1. MODEL ARCHITECTURE
# -------------------------------------------------------------
class DeepfakeClassifier(nn.Module):
    def __init__(self, input_dim=3072):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.GELU(),
            nn.Dropout(0.4),
            nn.Linear(512, 128),
            nn.BatchNorm1d(128),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(128, 2)
        )
    def forward(self, x):
        return self.net(x)

# -------------------------------------------------------------
# 2. DETECTOR ENGINE (HIGH-SENSITIVITY FORENSICS)
# -------------------------------------------------------------
class DeepfakeDetector:
    def __init__(self, weights_path="wavlm_deepfake_head.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"🚀 Initializing WavLM on: {self.device}...")
        
        self.wavlm = WavLMModel.from_pretrained("microsoft/wavlm-base-plus").to(self.device)
        self.wavlm.eval()
        
        self.classifier = DeepfakeClassifier().to(self.device)
        if not os.path.exists(weights_path):
            raise FileNotFoundError(f"Missing weights file '{weights_path}'!")
            
        self.classifier.load_state_dict(torch.load(weights_path, map_location=self.device))
        self.classifier.eval()
        
        self.target_sr = 16000
        self.chunk_samples = int(4.0 * self.target_sr)

    def extract_audio(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        temp_audio_path = "temp_extracted_audio.wav"
        
        if ext in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
            video = VideoFileClip(file_path)
            if video.audio is None:
                video.close()
                raise ValueError("Video has no audio track!")
            video.audio.write_audiofile(temp_audio_path, fps=self.target_sr, codec='pcm_s16le', logger=None)
            video.close()
            waveform, sr = torchaudio.load(temp_audio_path)
            if os.path.exists(temp_audio_path): os.remove(temp_audio_path)
        else:
            waveform, sr = torchaudio.load(file_path)
            if sr != self.target_sr:
                waveform = torchaudio.functional.resample(waveform, sr, self.target_sr)
                
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
            
        waveform = waveform.squeeze(0)
        max_val = waveform.abs().max()
        if max_val > 0:
            waveform = waveform / max_val * 0.95
        return waveform

    def analyze(self, file_path):
        waveform = self.extract_audio(file_path)
        total_samples = waveform.shape[0]
        
        if total_samples < self.chunk_samples:
            pad_amt = self.chunk_samples - total_samples
            chunks = [torch.nn.functional.pad(waveform, (0, pad_amt))]
        else:
            step = int(self.chunk_samples * 0.5)
            chunks = [
                waveform[i : i + self.chunk_samples]
                for i in range(0, total_samples - self.chunk_samples + 1, step)
            ]
            if len(chunks) == 0:
                chunks = [waveform[:self.chunk_samples]]

        chunk_probs = []
        with torch.no_grad():
            for chunk in chunks:
                chunk = (chunk - chunk.mean()) / (chunk.std() + 1e-7)
                chunk = chunk.unsqueeze(0).to(self.device)
                
                outputs = self.wavlm(chunk, output_hidden_states=True)
                
                layer_6 = outputs.hidden_states[6]
                layer_12 = outputs.hidden_states[12]
                
                p6 = torch.cat([torch.mean(layer_6, dim=1), torch.std(layer_6, dim=1)], dim=-1)
                p12 = torch.cat([torch.mean(layer_12, dim=1), torch.std(layer_12, dim=1)], dim=-1)
                
                emb = torch.cat([p6, p12], dim=-1)
                logits = self.classifier(emb)
                prob_fake = torch.softmax(logits, dim=1)[0, 1].item()
                chunk_probs.append(prob_fake)
                
        avg_score = float(np.mean(chunk_probs))
        max_score = float(np.max(chunk_probs))
        
        # Operational Forensic Rule: If peak >= 35% OR avg >= 25% -> AI Voice
        if max_score >= 0.35 or avg_score >= 0.25:
            verdict = "🚨 SYNTHETIC / AI VOICE"
            # Calibrate display confidence for clean presentation
            raw_c = max(avg_score * 1.5, max_score)
            display_conf = min(round(raw_c * 100, 2), 99.8)
        else:
            verdict = "✅ REAL HUMAN VOICE"
            display_conf = round((1.0 - avg_score) * 100, 2)
        
        return verdict, f"{display_conf}%", f"{round(max_score * 100, 2)}%", len(chunks)

# -------------------------------------------------------------
# 3. GRADIO WEB UI
# -------------------------------------------------------------
detector = DeepfakeDetector()

def process_file(uploaded_file):
    if uploaded_file is None:
        return "No file uploaded", "0%", "0%", "0"
    verdict, confidence, peak_score, num_chunks = detector.analyze(uploaded_file.name)
    return verdict, confidence, peak_score, str(num_chunks)

if __name__ == "__main__":
    print("\n🌐 Launching UI on http://127.0.0.1:7860 ...")
    demo = gr.Interface(
        fn=process_file,
        inputs=gr.File(label="Upload Audio or Video (.mp4, .mp3, .wav)"),
        outputs=[
            gr.Textbox(label="Detection Verdict"),
            gr.Textbox(label="Overall Confidence Score"),
            gr.Textbox(label="Peak Segment AI Score"),
            gr.Textbox(label="4-Second Segments Analyzed")
        ],
        title="🎙️ AI Audio Deepfake Detector",
        description="Upload any YouTube clip, voice note, or video to detect synthetic speech."
    )
    demo.launch(server_port=7860)