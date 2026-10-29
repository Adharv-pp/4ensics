# 4ensics — Image Module (Gradio package)

Standalone Gradio packaging of the Image Forensic pipeline for integration
into the unified 4ensics UI. Full parity with the Streamlit `app_final.py`
— same risk assessment, same model selector, same ELA/FFT heatmaps.

## What's in this folder

```
app_image.py                          - the Gradio app (UI + auto API)
risk_engine.py                        - risk scoring / priority banding (REQUIRED)
final_ensemble.py                     - ensemble prediction pipeline (REQUIRED)
ela_fft_features_v2.py                - feature extractor, 8-feature models + heatmaps (REQUIRED)
ela_fft_features_v3.py                - feature extractor, 10-feature models + face detection (REQUIRED)
forensics_model.joblib                - Scene variant (CIFAKE-trained)
forensics_model_whatsapp.joblib       - Human variant (WhatsApp-compression-simulated)
forensics_model_v4.joblib             - Filtered Person variant (face-crop + filter + low-light)
forensics_model_unified_rf.joblib     - Unified Random Forest variant
forensics_model_unified_gb.joblib     - Unified Gradient Boosting variant
README.md                             - this file
```

`app_image.py` does not reimplement any detection or scoring logic — it
calls `risk_engine.compute_risk()` (the same function `app_final.py`
calls) and formats its output for Gradio. All five `.joblib` files are
required for the ensemble average.

## Install and run

```bash
pip install gradio joblib numpy scikit-learn opencv-python-headless pillow exifread --break-system-packages
python app_image.py
```

`exifread` is optional — if it isn't installed, the metadata signal
degrades gracefully rather than crashing.

This starts:
- a **Gradio UI** at `http://localhost:7861`
- an **auto-generated API** at `http://localhost:7861/?view=api`

Each module in the unified system should run on its own port. This module
uses **7861**. Coordinate with the other module owners so ports don't
collide (e.g. video on 7862, audio on 7863, text on 7864).

## Input format

| Input | Type | Notes |
|---|---|---|
| Evidence Image | file upload (`.jpg`, `.jpeg`, `.png`) | passed to `risk_engine.compute_risk()` as a filepath |
| Model | dropdown | `"All models combined (recommended)"` or one of the five `.joblib` filenames, to feature that single model's result as primary |

Over the API, call with the image file and the model-choice string as the
two positional inputs — Gradio's `/?view=api` page shows the exact call
syntax for whatever client you're integrating from (curl, Python
`gradio_client`, or JS).

## Output fields

| Field | Type | Example | Meaning |
|---|---|---|---|
| `priority_level` | string | `"High"` | `Low` / `Medium` / `High` triage band. Show this with the same color coding as the rest of the unified UI: green/amber/red. |
| `risk_score` | string | `"78.5/100"` | The primary risk indicator — ML consensus plus the independent metadata signal, capped at 100. |
| `recommendation` | string | `"Multiple forensic indicators detected and/or high model consensus. Prioritize for immediate manual forensic review."` | Human-readable next-step guidance tied to the priority band. |
| `forensic_indicators` | string (newline-separated bullets) | `"- Elevated periodicity in frequency spectrum...\n- Low agreement between forensic models..."` | The specific signals that drove the score — always show this, since it's what makes a score auditable rather than opaque. |
| `model_agreement_pct` | string | `"62.0%"` | How closely the models agree with each other, independent of direction. Low agreement is itself a meaningful finding — surface it even when the risk score looks moderate. |
| `content_type` | string | `"Face-centric photo (face confidence: 0.87)"` | What the image appears to contain, used to judge whether the selected model variant is well-matched to this evidence. |
| `individual_model_results` | string | `"forensics_model.joblib: fake=81.2% | forensics_model_v4.joblib: fake=72.1%"` | Per-model breakdown so an analyst can see whether models agree or disagree, not just the blended average. |
| `model_training_domain_note` | string | `"forensics_model_v4.joblib — trained on: 140k Real/Fake Faces, face-cropped... | best matches: face-centric photos, including filtered selfies and webcam captures"` | What the featured model was actually trained on — transparency about data composition, not a claim that this model is "correct" for this image. |
| `exif_note` | string | `"No EXIF metadata found. Common and NOT itself suspicious..."` | Plain-language note on the image's metadata state. |
| `sha256_hash` | string | `"a3f5c8..."` | Integrity hash of the uploaded file — recompute anytime to verify the evidence hasn't changed since upload. |
| `image_properties` | string | `"Dimensions: 1024 x 768 px | File size: 342.1 KB | Color mode: RGB"` | Basic file properties, same as the Streamlit app's evidence panel. |
| `ela_heatmap` | image | — | Error Level Analysis heatmap (Q95). Edges/detail naturally light up in any photo — look for localized inconsistency, not the outline itself. |
| `fft_magnitude_spectrum` | image | — | FFT magnitude spectrum. The center cross is normal for any image — look for regular grid texture radiating outward. |

## Known limits (for context when displaying results)

- The `forensics_model_whatsapp.joblib` (Human) variant is the weakest of
  the individually-evaluated variants (see the project report, Table
  8.3) — worth surfacing as a caveat when its individual result is
  featured.
- Priority-level thresholds and indicator cutoffs are reasonable starting
  points for a working prototype, not values statistically validated
  against a large labeled forensic dataset.
- This is decision support, not a standalone verdict — final forensic and
  legal determinations remain with the human analyst.
