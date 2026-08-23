import os
import io
import base64
import hashlib
import logging
import joblib
import numpy as np
import cv2
from PIL import Image, ImageChops

try:
    from skimage.feature import local_binary_pattern
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False

try:
    import exifread
    HAS_EXIFREAD = True
except ImportError:
    HAS_EXIFREAD = False

logger = logging.getLogger("4ensics.image_detector")

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


def detect_and_crop_face(img_bgr, padding=0.3):
    """Detects face using OpenCV Haar Cascade. Returns (cropped_or_orig, confidence)."""
    if img_bgr is None:
        return None, 0.0
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(40, 40))
        if len(faces) > 0:
            x, y, w, h = faces[0]
            pad_x, pad_y = int(w * padding), int(h * padding)
            h_img, w_img = img_bgr.shape[:2]
            x1, y1 = max(0, x - pad_x), max(0, y - pad_y)
            x2, y2 = min(w_img, x + w + pad_x), min(h_img, y + h + pad_y)
            return img_bgr[y1:y2, x1:x2], 0.85
    except Exception:
        pass
    return img_bgr, 0.0


def detect_content_type(img_bgr):
    """Returns (content_type_label, face_confidence)."""
    if img_bgr is None:
        return "Unknown", 0.0
    _, conf = detect_and_crop_face(img_bgr)
    if conf > 0.5:
        return "Face-centric photo", conf
    return "General scene / object", conf


def compute_ela_stats_and_heatmap(pil_rgb, quality_high=95, quality_low=70):
    """
    Computes genuine multi-scale Error Level Analysis:
    - High-quality (95) compression difference and visual heatmap (Inferno colormap)
    - Low-quality (70) compression difference for multi-scale ratio
    """
    # Quality 95 (High)
    buf_95 = io.BytesIO()
    pil_rgb.save(buf_95, "JPEG", quality=quality_high)
    buf_95.seek(0)
    resaved_95 = Image.open(buf_95)
    diff_95 = ImageChops.difference(pil_rgb, resaved_95)
    diff_np_95 = np.array(diff_95).astype(np.float32)

    ela_mean_95 = float(np.mean(diff_np_95))
    ela_var_95 = float(np.var(diff_np_95))

    # Quality 70 (Low) for true multi-scale ratio
    buf_70 = io.BytesIO()
    pil_rgb.save(buf_70, "JPEG", quality=quality_low)
    buf_70.seek(0)
    resaved_70 = Image.open(buf_70)
    diff_70 = ImageChops.difference(pil_rgb, resaved_70)
    diff_np_70 = np.array(diff_70).astype(np.float32)

    ela_mean_70 = float(np.mean(diff_np_70))
    ela_multiscale_ratio = float(ela_mean_70 / (ela_mean_95 + 1e-8))

    # Generate Visual Heatmap from Q95
    diff_gray = cv2.cvtColor(np.array(diff_95), cv2.COLOR_RGB2GRAY)
    diff_boosted = cv2.multiply(diff_gray, 10)
    colored = cv2.applyColorMap(diff_boosted, cv2.COLORMAP_INFERNO)
    colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    heatmap_pil = Image.fromarray(colored_rgb)

    return heatmap_pil, ela_mean_95, ela_var_95, ela_multiscale_ratio


def compute_fft_stats_and_heatmap(gray_img, ring=(0.35, 0.9), z=3.0):
    """
    Computes 2D Fast Fourier Transform magnitude spectrum plus scalar frequency metrics.
    """
    f = np.fft.fft2(gray_img.astype(np.float32))
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)
    log_mag = np.log1p(mag)

    h, w = gray_img.shape
    cy, cx = h // 2, w // 2
    y, x = np.ogrid[:h, :w]
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    r_norm = r / (np.sqrt(cx ** 2 + cy ** 2) + 1e-8)
    mask = (r_norm >= ring[0]) & (r_norm <= ring[1])
    vals = log_mag[mask]

    if vals.size == 0:
        peak_ratio = 0.0
        energy_var = 0.0
    else:
        mu, sigma = vals.mean(), vals.std() + 1e-8
        peak_ratio = float(np.mean((vals - mu) / sigma > z))
        r_ring = r[mask].astype(np.int32)
        bins = np.bincount(r_ring, weights=vals)
        counts = np.bincount(r_ring)
        counts[counts == 0] = 1
        energy_var = float(np.var(bins / counts))

    # Visual Colormap (Viridis)
    norm = (log_mag - log_mag.min()) / (log_mag.max() - log_mag.min() + 1e-8)
    norm_uint8 = np.uint8(norm * 255)
    colored = cv2.applyColorMap(norm_uint8, cv2.COLORMAP_VIRIDIS)
    colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    spectrum_pil = Image.fromarray(colored_rgb)

    return spectrum_pil, peak_ratio, energy_var


def compute_texture_metrics(gray_img):
    """Computes Laplacian variance, 8x8 JPEG grid blockiness, and LBP texture energy."""
    laplacian_var = float(cv2.Laplacian(gray_img, cv2.CV_64F).var())

    # 8x8 JPEG blockiness
    diff = np.abs(np.diff(gray_img.astype(np.float32), axis=1))
    cols = np.arange(diff.shape[1])
    block_cols = cols[(cols % 8) == 7]
    non_block_cols = cols[(cols % 8) != 7]
    if len(block_cols) == 0 or len(non_block_cols) == 0:
        block_score = 1.0
    else:
        block_energy = diff[:, block_cols].mean()
        non_block_energy = diff[:, non_block_cols].mean()
        block_score = float(block_energy / (non_block_energy + 1e-8))

    # LBP texture energy
    if HAS_SKIMAGE:
        lbp = local_binary_pattern(gray_img, P=8, R=1, method="uniform")
        hist, _ = np.histogram(lbp, bins=np.arange(0, 11), density=True)
        lbp_e = float(np.sum(hist ** 2))
    else:
        lbp_e = float(laplacian_var / (laplacian_var + 100.0))

    return laplacian_var, block_score, lbp_e


def image_to_base64(pil_img):
    if pil_img is None:
        return ""
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"


def check_exif(image_path):
    """Reads EXIF metadata stream without imposing false penalties for missing tags."""
    if not HAS_EXIFREAD:
        return {
            "available": False,
            "note": "No EXIF metadata found. Common and NOT itself suspicious (often stripped by messaging apps or social platforms)."
        }
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


def independent_metadata_signal(exif_context):
    """
    Independent metadata signal.
    Missing EXIF receives 0 penalty (WhatsApp/Instagram/Signal strip EXIF naturally).
    Only specific generative/editing software tags add risk points.
    """
    if not exif_context or not exif_context.get("available"):
        return 0, None

    software = (exif_context.get("software_tag") or "").lower()
    suspicious_tools = ["photoshop", "gimp", "midjourney", "stable diffusion",
                         "dall-e", "dalle", "faceapp", "facetune", "generative"]
    for tool in suspicious_tools:
        if tool in software:
            return 15, f"Editing/generation software detected in metadata: {exif_context.get('software_tag')}"

    return 0, None


def generate_forensic_indicators(feats_v3, consensus_fake_pct, agreement_score):
    """Surfaces human-auditable forensic anomaly indicators."""
    indicators = []
    if feats_v3 is None:
        return ["No strong forensic anomalies detected by automated indicators"]

    if feats_v3.get("fft_high_freq_peak_ratio", 0) > 0.01:
        indicators.append("Elevated periodicity in frequency spectrum (possible generative upsampling artifact)")

    if feats_v3.get("ela_multiscale_ratio", 0) > 5.0:
        indicators.append("Large shift in Error Level Analysis across compression levels (possible multi-generation compression or splicing)")

    if feats_v3.get("lbp_energy", 0) > 0.16:
        indicators.append("Unusually smooth/low-texture regions detected (consistent with either heavy filtering or synthetic generation)")

    if feats_v3.get("blockiness_score", 1.0) > 1.3:
        indicators.append("Strong 8x8 JPEG block-grid artifacts detected")

    if agreement_score < 0.6:
        indicators.append("Low agreement between forensic models trained on different data — signal is ambiguous")

    if consensus_fake_pct > 65.0:
        indicators.append("Multiple forensic models indicate elevated risk signal")

    if not indicators:
        indicators.append("No strong forensic anomalies detected by automated indicators")

    return indicators


class ImageDeepfakeDetector:
    def __init__(self, models_dir=None):
        self.candidate_dirs = []
        if models_dir:
            self.candidate_dirs.append(models_dir)

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.candidate_dirs.append(os.path.join(base_dir, "models", "image"))
        self.candidate_dirs.append(os.path.join(base_dir, "deepfakeimage"))

        self.bundles = []
        self._load_models()

    def _load_models(self):
        self.bundles = []
        loaded_names = set()

        for d in self.candidate_dirs:
            if not os.path.exists(d):
                continue
            for fname in MODEL_FILES:
                if fname in loaded_names:
                    continue
                fpath = os.path.join(d, fname)
                if os.path.exists(fpath):
                    try:
                        b = joblib.load(fpath)
                        self.bundles.append({
                            "path": fname,
                            "bundle": b,
                            "n_features": len(b.get("feature_names", []))
                        })
                        loaded_names.add(fname)
                    except Exception as e:
                        logger.warning(f"Error loading image model {fname} from {d}: {e}")

        if not self.bundles:
            logger.error(
                f"No forensic ML models found in search paths: {self.candidate_dirs}. "
                "Ensure .joblib model files are placed in backend/models/image/."
            )
        else:
            logger.info(f"Loaded {len(self.bundles)} forensic image models: {[b['path'] for b in self.bundles]}")

    def analyze(self, image_path, model_choice="All models combined (recommended)"):
        if not self.bundles:
            raise RuntimeError(
                f"No trained forensic models found in {self.candidate_dirs}. "
                "Please ensure .joblib model files are present in backend/models/image/."
            )

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

        # Load image into memory once
        pil_rgb = Image.open(image_path).convert("RGB")
        img_bgr = cv2.cvtColor(np.array(pil_rgb), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Compute ELA stats and visual heatmap once
        ela_img, ela_mean_95, ela_var_95, ela_ratio = compute_ela_stats_and_heatmap(pil_rgb)
        ela_b64 = image_to_base64(ela_img)

        # 2. Compute FFT stats and visual spectrogram once
        fft_img, peak_ratio, energy_var = compute_fft_stats_and_heatmap(gray)
        fft_b64 = image_to_base64(fft_img)

        # 3. Compute texture & spatial metrics once
        lap_var, block_score, lbp_e = compute_texture_metrics(gray)

        # Construct 8-feature dictionary (v2)
        feats_v2 = {
            "ela_mean": ela_mean_95,
            "ela_variance": ela_var_95,
            "ela_multiscale_ratio": ela_ratio,
            "fft_high_freq_peak_ratio": peak_ratio,
            "fft_energy_ratio_variance": energy_var,
            "laplacian_var": lap_var,
            "blockiness_score": block_score,
            "lbp_energy": lbp_e,
        }

        # Extend into 10-feature dictionary (v3) without recomputing ELA/FFT
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        sat_std = float(np.std(hsv[:, :, 1]))
        edges = cv2.Canny(img_bgr, 100, 200)
        edge_density = float(np.mean(edges > 0))

        feats_v3 = dict(feats_v2)
        feats_v3["saturation_std"] = sat_std
        feats_v3["edge_density"] = edge_density

        individual_results = {}
        for entry in self.bundles:
            n = entry["n_features"]
            bundle = entry["bundle"]
            feats = feats_v3 if n == 10 else feats_v2
            fn = bundle.get("feature_names", [])

            x = np.array([[feats.get(name, 0.0) for name in fn]])
            try:
                if "scaler" in bundle and bundle["scaler"] is not None:
                    x = bundle["scaler"].transform(x)
                proba = bundle["model"].predict_proba(x)[0]
                prob_real, prob_fake = float(proba[0]), float(proba[1])
            except Exception as e:
                logger.warning(f"Error predicting with {entry['path']}: {e}")
                prob_real, prob_fake = 0.5, 0.5

            individual_results[entry["path"]] = {
                "prob_real": round(prob_real, 3),
                "prob_fake": round(prob_fake, 3)
            }

        # ML Consensus
        fake_probs = [r["prob_fake"] for r in individual_results.values()]
        consensus_fake_pct = (sum(fake_probs) / len(fake_probs)) * 100.0
        spread = max(fake_probs) - min(fake_probs)
        agreement_score = max(0.0, 1.0 - spread)

        content_type, face_confidence = detect_content_type(img_bgr)

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
        indicators = generate_forensic_indicators(feats_v3, consensus_fake_pct, agreement_score)
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
                "trained_on": "5-Model Multi-Variant Ensemble (CIFAKE + WhatsApp + Filtered Faces + Unified RF + Unified GB)",
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
            "verdict": "Elevated Forensic Anomaly (High Risk)" if priority == "High" else ("Ambiguous Signal / Needs Review" if priority == "Medium" else "Authentic Photographic Evidence"),
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
