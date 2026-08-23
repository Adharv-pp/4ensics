import os
import tempfile
import math
import streamlit as st
import pandas as pd
import torch
import numpy as np
import cv2
from transformers import VideoMAEImageProcessor, VivitForVideoClassification

# Model Loading
@st.cache_resource
def load_model():
    processor = VideoMAEImageProcessor.from_pretrained("google/vivit-b-16x2-kinetics400")
    model = VivitForVideoClassification.from_pretrained("./deepfake_vivit_model/checkpoint-2880")
    model.eval()  
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    
    return processor, model, device

processor, model, device = load_model()

# Video Processing Helpers
def extract_segments(video_path, segment_sec=2.0, num_frames=16):
    """Splits the video into time segments and extracts 16 frames per segment."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file.")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if total_frames <= 0 or fps <= 0:
        cap.release()
        raise ValueError("Invalid video file (zero frames or FPS).")
        
    duration = total_frames / fps
    num_segments = math.ceil(duration / segment_sec)
    
    segments = []
    
    for i in range(num_segments):
        start_time = i * segment_sec
        end_time = min((i + 1) * segment_sec, duration)
        
        # Calculate frame boundaries for this segment
        start_frame = int(start_time * fps)
        end_frame = int(end_time * fps)
        
        # Edge case for very short segments at the end
        if end_frame <= start_frame:
            break
            
        indices = np.linspace(start_frame, end_frame - 1, num_frames, dtype=int)
        frames = []
        
        for idx in indices:
            idx = min(max(idx, 0), total_frames - 1) # Clamp to valid range
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            success, frame = cap.read()
            if success:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
        # Pad with the last frame if extraction came up short
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
    inputs = processor(list(frames), return_tensors="pt")
    pixel_values = inputs['pixel_values'].squeeze(0).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(pixel_values=pixel_values)
        logits = outputs.logits
        probabilities = torch.softmax(logits, dim=-1)[0]
        
        # Assuming Index 1 is FAKE and Index 0 is REAL based on your original API
        fake_prob = probabilities[1].item()
        real_prob = probabilities[0].item()
        
    return fake_prob, real_prob

# Streamlit UI
st.set_page_config(page_title="Deepfake Detector", layout="centered")

st.title("Deepfake Detection & Analysis")
st.write("Upload a video to run the ViViT classification pipeline and get timestamped justifications.")

uploaded_file = st.file_uploader("Select video file", type=["mp4", "mkv", "avi"])

if uploaded_file is not None:
    st.video(uploaded_file)
    
    # Let user choose analysis depth
    analysis_mode = st.radio(
        "Analysis Mode", 
        ["Quick Scan (Entire Video)", "Deep Scan (Timestamp Breakdown - Slower)"],
        horizontal=True
    )
    
    if st.button("Analyze Stream", use_container_width=True):
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            tmp_file.write(uploaded_file.read())
            temp_filepath = tmp_file.name
            
        try:
            if "Quick Scan" in analysis_mode:
                with st.spinner("Processing full sequence..."):
                    # Original behavior: 1 segment for the whole video
                    segments = extract_segments(temp_filepath, segment_sec=9999.0)
                    fake_prob, real_prob = run_inference(segments[0]["frames"])
                    
                    is_fake = fake_prob > 0.5
                    verdict = "FAKE" if is_fake else "REAL"
                    confidence = max(fake_prob, real_prob)
                    
                    st.divider()
                    col1, col2 = st.columns(2)
                    col1.metric("Overall Verdict", verdict)
                    col2.metric("Confidence", f"{confidence * 100:.1f}%")
                    
            else:
                st.write("### Deep Scan Progress")
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                # Split video into 2-second chunks
                segments = extract_segments(temp_filepath, segment_sec=2.0)
                total_segments = len(segments)
                
                results = []
                
                for i, seg in enumerate(segments):
                    status_text.text(f"Analyzing segment {i+1} of {total_segments} ({seg['time_label']})...")
                    fake_prob, real_prob = run_inference(seg["frames"])
                    
                    results.append({
                        "Time": seg["time_label"],
                        "Start": seg["start"],
                        "FAKE Probability (%)": round(fake_prob * 100, 2),
                        "REAL Probability (%)": round(real_prob * 100, 2),
                        "Verdict": "FAKE" if fake_prob > 0.5 else "REAL"
                    })
                    
                    progress_bar.progress((i + 1) / total_segments)
                    
                status_text.text("Analysis Complete.")
                
                # Aggregate Results
                df = pd.DataFrame(results)
                avg_fake = df["FAKE Probability (%)"].mean()
                final_verdict = "FAKE" if avg_fake > 50 else "REAL"
                
                st.divider()
                st.subheader("Result Summary")
                
                col1, col2 = st.columns(2)
                col1.metric("Overall Verdict", final_verdict)
                col2.metric("Avg FAKE Confidence", f"{avg_fake:.1f}%")
                
                # Dynamic Justification Generation
                st.subheader("Why?")
                if final_verdict == "FAKE":
                    highest_fake = df.loc[df["FAKE Probability (%)"].idxmax()]
                    st.error(f"**Justification:** The video is flagged as FAKE because the model detected significant synthetic anomalies. The most prominent manipulation was found between **{highest_fake['Time']}**, where the FAKE confidence spiked to **{highest_fake['FAKE Probability (%)']}%**.")
                else:
                    lowest_fake = df.loc[df["FAKE Probability (%)"].idxmax()] # The highest it ever got
                    st.success(f"**Justification:** The video appears to be REAL. Across all timeline segments, the model did not detect major synthetic anomalies. The highest anomaly score was only **{lowest_fake['FAKE Probability (%)']}%** at **{lowest_fake['Time']}**, which is well below the threshold.")

                # Timeline Data
                st.subheader("Confidence Over Time")
                chart_data = df.set_index("Time")[["FAKE Probability (%)"]]
                st.line_chart(chart_data)
                
                with st.expander("View Raw Timestamp Data"):
                    st.dataframe(df.drop(columns=["Start"]), use_container_width=True)

        except Exception as e:
            st.error(f"Inference Pipeline Error: {str(e)}")
        finally:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)