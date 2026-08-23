# 4ensics — Photo & Face Image Forensics Module

A standalone packaging of the 4ensics Image Forensic pipeline for integration into the unified digital evidence UI. This module analyzes incoming photographic evidence and produces a forensic risk assessment to help prioritize human analyst review. 

This system acts as **decision support, not a decision-maker**. It does not declare evidence "real" or "fake" — final forensic and legal determinations remain with the human analyst.

---

## ⚙️ Pre-Upload Model Selection

This module gives the analyst complete control over the forensic evaluation *before* the image is processed. 

When submitting an image via the Streamlit dashboard (`app_final.py`), you must select a **Model Choice** to dictate how the AI evaluates the evidence:

* **"All models combined (recommended)"**: The image is routed through all 5 trained models simultaneously. The system calculates a unified ML Consensus score based on the aggregate results.
* **Specific Model Override (e.g., "forensics_model_v4.joblib")**: If an analyst already knows the context of the image (e.g., they know it is a filtered selfie), they can force the dashboard to feature the results of the specific model trained on that exact domain. *Note: To prevent forensic tunnel vision, the background Risk Score and Priority Level will still utilize the full 5-model consensus.*

---

## 🧠 Core Logic: The Risk Engine & Final Ensemble

The brain of this module is `risk_engine.py`, which exposes the `compute_risk()` wrapper function. Instead of relying on a single AI model that might have domain blind spots, the engine uses a **5-Model Consensus Architecture**:

1. **`forensics_model.joblib` (Scene Variant):** Trained on the CIFAKE benchmark. Best for general scenes, objects, and synthetic generative landscapes.
2. **`forensics_model_whatsapp.joblib` (Human/Compression Variant):** Trained on 140k faces with simulated aggressive WhatsApp compression. Best for forwarded social media evidence.
3. **`forensics_model_v4.joblib` (Filtered Person Variant):** Trained on 140k face-cropped images with beauty-filter and low-light augmentations. Best for social media selfies and webcam captures.
4. **`forensics_model_unified_rf.joblib` (Random Forest):** Class-balanced model trained on the 12k Kaggle unified dataset. Provides a high-accuracy baseline.
5. **`forensics_model_unified_gb.joblib` (Gradient Boosting):** Histogram-based model. Highly robust for outlier detection on deepfakes.

### How the Consensus Risk Score is Calculated
When an image is passed to `compute_risk()`, the engine mathematically evaluates model agreement:
* **Base Average (95% weight):** Calculates the mean "fake probability" across all models.
* **Disagreement Penalty (5% weight):** Measures the `spread` (maximum prediction minus minimum prediction). If the models heavily disagree (low agreement), the system adds a penalty to the risk score. High model disagreement means the image is highly ambiguous, automatically escalating it for human review.

### Priority Triage Banding
The risk engine automatically assigns a Priority Level based on the final score:
* **High (≥ 65.0/100):** Multiple indicators detected or high model consensus.
* **Medium (35.0 - 64.9/100):** Moderate anomaly indicators; manual inspection advised.
* **Low (< 35.0/100):** No prominent generative artifacts detected.

---

## 📁 Repository Structure

```text
app_final.py                          - The main Streamlit application dashboard
risk_engine.py                        - The core logic, scoring, and ensemble prediction pipeline (REQUIRED)
ela_fft_features_v3.py                - Advanced feature extractor with texture metrics and heatmaps (REQUIRED)
forensics_model.joblib                - Scene model variant
forensics_model_whatsapp.joblib       - Compressed portrait model variant
forensics_model_v4.joblib             - Filtered face model variant
forensics_model_unified_rf.joblib     - Unified Random Forest variant
forensics_model_unified_gb.joblib     - Unified Gradient Boosting variant
README.md                             - This file
```
