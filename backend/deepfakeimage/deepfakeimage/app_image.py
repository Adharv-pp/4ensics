"""
app_image.py — 4ensics Image Module (Gradio interface + auto-generated API)

Full-parity Gradio port of app_final.py's photo-evidence pipeline. Every
piece of app_final.py's output is reproduced here:

  - risk_engine.compute_risk() drives the assessment (risk score, priority
    band, model agreement, forensic indicators, recommendation, content
    type / face confidence, model training domains, optional model
    override) — exactly what app_final.py calls.
  - SHA-256 hash + image properties (dimensions, file size, color mode),
    same as app_final.py's "Image Properties & Evidence Integrity" panel.
  - ELA heatmap + FFT magnitude spectrum images, same as app_final.py's
    "Supporting Forensic Evidence" section (via ela_fft_features_v2).

This file does not reimplement any detection logic itself — it only
formats risk_engine's output for Gradio's UI/API, the same way
app_final.py formats it for Streamlit.
"""

import hashlib

import cv2
import gradio as gr
import numpy as np
from PIL import Image

from risk_engine import compute_risk
from final_ensemble import MODEL_FILES
from ela_fft_features_v2 import compute_ela_map, compute_fft_map

MODEL_CHOICES = ["All models combined (recommended)"] + MODEL_FILES


def run_analysis(image_path, model_choice):
    if image_path is None:
        return ("No image provided",) * 12

    # ---- Image properties & integrity (mirrors app_final.py col1 panel) ----
    with open(image_path, "rb") as f:
        file_bytes = f.read()
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    pil_img = Image.open(image_path)
    width, height = pil_img.size
    file_size_kb = len(file_bytes) / 1024
    color_mode = pil_img.mode
    image_properties = (
        f"Dimensions: {width} x {height} px | "
        f"File size: {file_size_kb:.1f} KB | "
        f"Color mode: {color_mode}"
    )

    # ---- Risk assessment (mirrors app_final.py's compute_risk call) ----
    model_override = None if model_choice == "All models combined (recommended)" else model_choice
    result = compute_risk(image_path, model_override=model_override)

    priority_level = result["priority_level"]
    risk_score = f"{result['risk_score']}/100"
    recommendation = result["recommendation"]
    model_agreement = f"{result['model_agreement_pct']}%"
    content_type = f"{result['content_type']} (face confidence: {result['face_confidence']})"

    indicators_text = "\n".join(f"- {i}" for i in result["forensic_indicators"])

    individual_lines = [
        f"{path}: fake={r['prob_fake'] * 100:.1f}%"
        for path, r in result["individual_model_results"].items()
    ]
    individual_summary = " | ".join(individual_lines)

    domains = result["model_training_domains"]
    if model_override:
        d = domains.get(model_override, {})
        domain_note = f"{model_override} — trained on: {d.get('trained_on', 'n/a')} | best matches: {d.get('best_matches', 'n/a')}"
    else:
        domain_note = "Combined score — see individual_model_results for per-model breakdown."

    exif_note = result["exif_context"].get("note", "No metadata context available.")

    # ---- Supporting forensic evidence: ELA + FFT (mirrors app_final.py) ----
    ela_map, _, _ = compute_ela_map(image_path, quality=95)
    gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    fft_map, _, _ = compute_fft_map(gray)
    fft_display = (fft_map - fft_map.min()) / (fft_map.max() - fft_map.min() + 1e-8)
    fft_display_uint8 = (fft_display * 255).astype(np.uint8)

    return (
        priority_level,
        risk_score,
        recommendation,
        indicators_text,
        model_agreement,
        content_type,
        individual_summary,
        domain_note,
        exif_note,
        sha256_hash,
        image_properties,
        ela_map,
        fft_display_uint8,
    )


demo = gr.Interface(
    fn=run_analysis,
    inputs=[
        gr.Image(type="filepath", label="Evidence Image"),
        gr.Dropdown(
            choices=MODEL_CHOICES,
            value="All models combined (recommended)",
            label="Model (feature the primary result from one model, or combine all)",
        ),
    ],
    outputs=[
        gr.Textbox(label="priority_level"),
        gr.Textbox(label="risk_score"),
        gr.Textbox(label="recommendation"),
        gr.Textbox(label="forensic_indicators"),
        gr.Textbox(label="model_agreement_pct"),
        gr.Textbox(label="content_type"),
        gr.Textbox(label="individual_model_results"),
        gr.Textbox(label="model_training_domain_note"),
        gr.Textbox(label="exif_note"),
        gr.Textbox(label="sha256_hash"),
        gr.Textbox(label="image_properties"),
        gr.Image(label="ela_heatmap"),
        gr.Image(label="fft_magnitude_spectrum"),
    ],
    title="4ensics — Image Forensic Module",
    description=(
        "Full forensic risk assessment for a photograph — the same "
        "pipeline as the Streamlit app (risk_engine.compute_risk), "
        "including the ELA heatmap and FFT magnitude spectrum. Decision "
        "support only — not a standalone verdict."
    ),
)

if __name__ == "__main__":
    demo.launch(server_port=7861)
