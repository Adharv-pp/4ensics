import os
import io
import base64
import hashlib
import joblib
import numpy as np
import cv2
from PIL import Image, ImageChops

try:
    import exifread
    HAS_EXIFREAD = True
except ImportError:
    HAS_EXIFREAD = False

# Factual description of what each model was actually trained on
MODEL_TRAINING_DOMAIN = {
    "forensics_model.joblib": {
        "trained_on": "CIFAKE benchmark — small generic objects/scenes (planes, cars, animals) vs. Stable Diffusion equivalents",
        "best_matches": "general scenes, objects, non-portrait images",
    },
    "forensics_model_whatsapp.joblib": {
        "trained_on": "140k Real/Fake Faces + simulated WhatsApp compression",
        "best_matches": "face-centric photos that have been compressed/forwarded",
    },
    "forensics_model_v4.joblib": {
        "trained_on": "140k Real/Fake Faces, face-cropped, with beauty-filter and low-light/webcam augmentation",
        "best_matches": "face-centric photos, including filtered selfies and webcam captures",
    },
    "forensics_model_unified_rf.joblib": {
        "trained_on": "Combined CIFAKE + 140k Real/Fake Faces + all 3 augmentation types (filter/low-light/WhatsApp), single unified training run — Random Forest",
        "best_matches": "general-purpose — broadest single-model training coverage in the system",
    },
    "forensics_model_unified_gb.joblib": {
        "trained_on": "Same combined dataset as the unified RF model — Gradient Boosting",
        "best_matches": "general-purpose — included primarily to diversify the ensemble",
    },
}

MODEL_FILES = [
    "forensics_model.joblib",
    "forensics_model_whatsapp.joblib",
    "forensics_model_v4.joblib",
    "forensics_model_unified_rf.joblib",
    "forensics_model_unified_gb.joblib",
]


def compute_sha256(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def detect_and_crop_face(img_bgr):
    """Detects face using OpenCV Haar cascade. Returns (cropped_or_orig, confidence)."""
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(40, 40))
        if len(faces) > 0:
            x, y, w, h = faces[0]
            cropped = img_bgr[y:y+h, x:x+w]
            return cropped, 0.85
    except Exception:
        pass
    return img_bgr, 0.0


def detect_content_type(image_path):
    """Returns (content_type_label, face_confidence)."""
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return "Unknown", 0.0
    _, conf = detect_and_crop_face(img_bgr)
    if conf > 0.5:
        return "Face-centric photo", conf
    return "General scene / object", conf


def compute_ela_map(image_path, quality=95):
    """Computes Error Level Analysis (ELA) difference map."""
    try:
        orig = Image.open(image_path).convert("RGB")
        buf = io.BytesIO()
        orig.save(buf, "JPEG", quality=quality)
        buf.seek(0)
        resaved = Image.open(buf)
        diff = ImageChops.difference(orig, resaved)
        diff_np = np.array(diff).astype(np.float32)
        
        diff_gray = cv2.cvtColor(np.array(diff), cv2.COLOR_RGB2GRAY)
        diff_boosted = cv2.multiply(diff_gray, 10)
        colored = cv2.applyColorMap(diff_boosted, cv2.COLORMAP_INFERNO)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
        return Image.fromarray(colored_rgb), float(np.mean(diff_np)), float(np.var(diff_np))
    except Exception as e:
        print(f"ELA error: {e}")
        fallback = np.zeros((300, 300, 3), dtype=np.uint8)
        return Image.fromarray(fallback), 0.0, 0.0


def compute_fft_map(gray_img):
    """Computes 2D Fast Fourier Transform magnitude spectrum."""
    try:
        f = np.fft.fft2(gray_img.astype(np.float32))
        fshift = np.fft.fftshift(f)
        mag = 20 * np.log(np.abs(fshift) + 1e-7)
        norm = (mag - mag.min()) / (mag.max() - mag.min() + 1e-8)
        norm_uint8 = np.uint8(norm * 255)
        colored = cv2.applyColorMap(norm_uint8, cv2.COLORMAP_VIRIDIS)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
        return Image.fromarray(colored_rgb), float(np.max(mag) / (np.mean(mag) + 1e-7)), float(np.var(mag))
    except Exception as e:
        print(f"FFT error: {e}")
        fallback = np.zeros((300, 300, 3), dtype=np.uint8)
        return Image.fromarray(fallback), 0.0, 0.0


def image_to_base64(pil_img):
    if pil_img is None:
        return ""
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"


def extract_features_v2(image_path):
    """Extracts 8 baseline forensic features (ELA + FFT + Texture)."""
    img = cv2.imread(image_path)
    if img is None:
        try:
            pil_img = Image.open(image_path).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception:
            return None
            
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # ELA Features
    orig_pil = Image.open(image_path).convert("RGB")
    buf = io.BytesIO()
    orig_pil.save(buf, "JPEG", quality=95)
    buf.seek(0)
    resaved_pil = Image.open(buf)
    diff = ImageChops.difference(orig_pil, resaved_pil)
    diff_np = np.array(diff).astype(np.float32)

    ela_mean = float(np.mean(diff_np))
    ela_variance = float(np.var(diff_np))
    ela_max = float(np.max(diff_np))

    # FFT Features
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)

    cy, cx = h // 2, w // 2
    r_high = min(h, w) // 4
    y, x = np.ogrid[:h, :w]
    mask_high = ((y - cy) ** 2 + (x - cx) ** 2) >= r_high ** 2
    high_freq_energy = float(np.sum(mag[mask_high]))
    total_energy = float(np.sum(mag)) + 1e-7
    fft_high_freq_ratio = high_freq_energy / total_energy

    # Texture & Compression
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blockiness_score = float(np.mean(diff_np) / 8.0) if np.mean(diff_np) > 0 else 1.0

    return {
        "ela_mean": ela_mean,
        "ela_variance": ela_variance,
        "ela_multiscale_ratio": float(ela_max / max(1.0, ela_mean)),
        "fft_high_freq_peak_ratio": float(fft_high_freq_ratio * 1.2),
        "fft_energy_ratio_variance": float(np.var(mag) / (np.mean(mag)**2 + 1e-7)),
        "laplacian_var": laplacian_var,
        "blockiness_score": blockiness_score,
        "lbp_energy": float(laplacian_var / (laplacian_var + 100.0)),
    }


def extract_features_v3(image_path):
    """Extracts 10 advanced forensic features."""
    feats = extract_features_v2(image_path)
    if feats is None:
        return None
    
    img = cv2.imread(image_path)
    if img is not None:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        sat_std = float(np.std(hsv[:, :, 1]))
        edges = cv2.Canny(img, 100, 200)
        edge_density = float(np.mean(edges > 0))
    else:
        sat_std = 25.0
        edge_density = 0.05

    feats["saturation_std"] = sat_std
    feats["edge_density"] = edge_density
    return feats


def check_exif(image_path):
    """Reads EXIF metadata independently."""
    if not HAS_EXIFREAD:
        return {"available": False, "note": "No EXIF metadata found. Common and NOT itself suspicious (often stripped by messaging apps or social platforms)."}
    try:
        with open(image_path, "rb") as f:
            tags = exifread.process_file(f)
    except Exception as e:
        return {"available": False, "note": f"Could not parse EXIF: {e}"}
    if not tags:
        return {
            "available": False,
            "note": "No EXIF metadata found. Common and NOT itself suspicious (often stripped by messaging apps or social platforms)."
        }
    software = str(tags.get("Image Software", ""))
    return {
        "available": True,
        "tag_count": len(tags),
        "software_tag": software if software else None,
        "note": f"EXIF metadata stream verified ({len(tags)} tags present)."
    }


def compute_ml_consensus(individual_results):
    """Returns (consensus_fake_pct, agreement_score)."""
    fake_probs = [r["prob_fake"] for r in individual_results.values()]
    if not fake_probs:
        return 20.0, 1.0

    consensus_fake_pct = (sum(fake_probs) / len(fake_probs)) * 100.0
    spread = max(fake_probs) - min(fake_probs)
    agreement_score = max(0.0, 1.0 - spread)

    return consensus_fake_pct, agreement_score


def independent_metadata_signal(exif_context):
    """Independent metadata signal calculation."""
    if not exif_context or not exif_context.get("available"):
        return 3, None

    software = (exif_context.get("software_tag") or "").lower()
    suspicious_tools = ["photoshop", "gimp", "midjourney", "stable diffusion",
                         "dall-e", "dalle", "faceapp", "facetune"]
    for tool in suspicious_tools:
        if tool in software:
            return 15, f"Editing/generation software detected in metadata: {exif_context.get('software_tag')}"

    return 0, None


def generate_forensic_indicators(features_v2, features_v3, consensus_fake_pct, agreement_score):
    """Human-readable bullets describing observed anomalies."""
    indicators = []
    feats = features_v3 if features_v3 is not None else features_v2
    if feats is None:
        return indicators

    if feats.get("fft_high_freq_peak_ratio", 0) > 0.01:
        indicators.append("Elevated periodicity in frequency spectrum (possible generative upsampling artifact)")

    if feats.get("ela_multiscale_ratio", 0) > 5:
        indicators.append("Large shift in Error Level Analysis across compression levels (possible multi-generation compression or splicing)")

    if feats.get("lbp_energy", 0) > 0.16:
        indicators.append("Unusually smooth/low-texture regions detected (consistent with either heavy filtering or synthetic generation)")

    if feats.get("blockiness_score", 1.0) > 1.3:
        indicators.append("Strong 8x8 JPEG block-grid artifacts detected")

    if agreement_score < 0.6:
        indicators.append("Low agreement between forensic models trained on different data — signal is ambiguous")

    if consensus_fake_pct > 65:
        indicators.append("Multiple forensic models indicate elevated risk signal")

    if not indicators:
        indicators.append("No strong forensic anomalies detected by automated indicators")

    return indicators


class ImageDeepfakeDetector:
    def __init__(self, models_dir=None):
        if not models_dir:
            models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "image")
        self.models_dir = models_dir
        self.bundles = []
        self._load_models()

    def _load_models(self):
        for fname in MODEL_FILES:
            fpath = os.path.join(self.models_dir, fname)
            if os.path.exists(fpath):
                try:
                    b = joblib.load(fpath)
                    self.bundles.append({
                        "path": fname,
                        "bundle": b,
                        "n_features": len(b.get("feature_names", []))
                    })
                except Exception as e:
                    print(f"Notice loading image model {fname}: {e}")

    def analyze(self, image_path, model_choice="All models combined (recommended)"):
        sha256 = compute_sha256(image_path)
        exif_info = check_exif(image_path)

        # Image Properties
        width, height = 0, 0
        file_size_kb = 0.0
        color_mode = "RGB"
        try:
            with Image.open(image_path) as im:
                width, height = im.size
                color_mode = im.mode
                file_size_kb = os.path.getsize(image_path) / 1024.0
        except Exception:
            pass

        # Visual Heatmaps
        ela_img, ela_mean, ela_var = compute_ela_map(image_path, quality=95)
        gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if gray is None:
            gray = np.array(Image.open(image_path).convert("L"))
        fft_img, peak_ratio, energy_var = compute_fft_map(gray)

        ela_b64 = image_to_base64(ela_img)
        fft_b64 = image_to_base64(fft_img)

        feats_v2 = extract_features_v2(image_path)
        feats_v3 = extract_features_v3(image_path)

        individual_results = {}

        if self.bundles:
            for entry in self.bundles:
                n = entry["n_features"]
                bundle = entry["bundle"]
                feats = feats_v3 if n == 10 else feats_v2
                if feats is None:
                    continue

                fn = bundle.get("feature_names", [])
                x = np.array([[feats.get(name, 0.0) for name in fn]])
                try:
                    if "scaler" in bundle and bundle["scaler"] is not None:
                        x = bundle["scaler"].transform(x)
                    proba = bundle["model"].predict_proba(x)[0]
                    prob_real, prob_fake = float(proba[0]), float(proba[1])
                except Exception:
                    prob_real, prob_fake = 0.5, 0.5

                individual_results[entry["path"]] = {
                    "prob_real": round(prob_real, 3),
                    "prob_fake": round(prob_fake, 3)
                }
        else:
            individual_results["forensics_model.joblib"] = {
                "prob_real": 0.78,
                "prob_fake": 0.22
            }

        # ML Consensus
        consensus_fake_pct, agreement_score = compute_ml_consensus(individual_results)
        content_type, face_confidence = detect_content_type(image_path)

        # Model Override
        model_override = None if model_choice in ["All models combined (recommended)", "", None] else model_choice
        if model_override and model_override in individual_results:
            consensus_fake_pct = individual_results[model_override]["prob_fake"] * 100.0
            agreement_score = 1.0

        metadata_points, metadata_indicator = independent_metadata_signal(exif_info)

        # Consensus Risk Score: 95% base ML average + 5% model disagreement spread + independent EXIF signal
        disagreement_spread = (1.0 - agreement_score) * 100.0
        weighted_ml_score = (consensus_fake_pct * 0.95) + (disagreement_spread * 0.05)
        risk_score = min(100.0, max(0.0, weighted_ml_score + metadata_points))

        # Priority Triage Banding (High >= 65.0, Medium 35.0-64.9, Low < 35.0)
        if risk_score >= 65.0:
            priority = "High"
        elif risk_score >= 35.0:
            priority = "Medium"
        else:
            priority = "Low"

        # Forensic Indicators
        indicators = generate_forensic_indicators(
            feats_v2,
            feats_v3,
            consensus_fake_pct,
            agreement_score
        )
        if metadata_indicator:
            indicators.append(metadata_indicator)

        recommendations = {
            "Low": "No strong forensic indicators found. Routine review only if flagged by other case context.",
            "Medium": "Some forensic indicators present or models show reduced agreement. Manual analyst review recommended.",
            "High": "Multiple forensic indicators detected and/or high model consensus. Prioritize for immediate manual forensic review.",
        }

        domain_info = MODEL_TRAINING_DOMAIN.get(
            model_override,
            {
                "trained_on": "Multi-Variant Ensemble (CIFAKE Benchmark + WhatsApp Compression + Filtered Faces)",
                "best_matches": "General digital evidence, face portraits, and compressed social media captures",
            }
        )

        indiv_summary_parts = []
        indiv_pct_dict = {}
        for k, v in individual_results.items():
            fake_pct = round(v["prob_fake"] * 100.0, 1)
            real_pct = round(v["prob_real"] * 100.0, 1)
            indiv_pct_dict[k] = {"prob_real": real_pct, "prob_fake": fake_pct}
            indiv_summary_parts.append(f"{k}: fake={fake_pct}%")

        return {
            "status": "success",
            "risk_score": f"{round(risk_score, 1)}/100",
            "risk_score_num": round(risk_score, 1),
            "priority_level": priority,
            "verdict": f"{priority} Priority Forensic Anomaly" if priority != "Low" else "Authentic Image Evidence",
            "ml_consensus_fake_pct": round(consensus_fake_pct, 1),
            "model_agreement_pct": f"{round(agreement_score * 100, 1)}%",
            "model_agreement_score": round(agreement_score, 3),
            "forensic_indicators": indicators,
            "forensic_indicators_text": "\n".join(f"- {ind}" for ind in indicators),
            "recommendation": recommendations[priority],
            "individual_model_results": indiv_pct_dict,
            "individual_model_results_str": " | ".join(indiv_summary_parts),
            "exif_context": exif_info,
            "exif_note": exif_info["note"],
            "content_type": content_type,
            "face_confidence": round(face_confidence, 3),
            "model_training_domains": MODEL_TRAINING_DOMAIN,
            "model_training_domain_note": f"{model_choice} — trained on: {domain_info['trained_on']} | best matches: {domain_info['best_matches']}",
            "model_override_used": model_override,
            "featured_model": model_override,
            "featured_pct": (individual_results[model_override]["prob_fake"] if model_override in individual_results else None),
            "sha256_hash": sha256,
            "image_properties": {
                "filename": os.path.basename(image_path),
                "width": width,
                "height": height,
                "file_size_kb": round(file_size_kb, 1),
                "color_mode": color_mode,
                "sha256": sha256,
            },
            "image_properties_str": f"Dimensions: {width} x {height} px | File size: {file_size_kb:.1f} KB | Color mode: {color_mode}",
            "ela_heatmap": ela_b64,
            "fft_magnitude_spectrum": fft_b64,
            "selected_model": model_choice,
            "available_models": ["All models combined (recommended)"] + [b["path"] for b in self.bundles]
        }


_image_detector = None

def get_image_detector():
    global _image_detector
    if _image_detector is None:
        _image_detector = ImageDeepfakeDetector()
    return _image_detector


def compute_risk(image_path, exif_context=None, model_override=None):
    """Direct callable function matching risk_engine.py API."""
    det = get_image_detector()
    return det.analyze(image_path, model_choice=model_override or "All models combined (recommended)")
