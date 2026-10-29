# 4ensics — Multi-Modal Media Forensics & AI Pre-Triage Platform

An end-to-end digital forensic analysis platform designed for pre-triage detection of synthetic, manipulated, and AI-generated media across **Audio**, **Video**, **Image**, and **Text / URLs**.

Developed as an academic research project at **CHRIST (Deemed to be University), Bengaluru**, under the guidance of **Dr. Chanti S**.

---

## 👥 Contributors & Modules
All team members contributed equally to the research, implementation, and integration of the platform:

* **Adharv P P** — *Audio Deepfake & Synthetic Voice Forensics*  
  Self-supervised representation learning via fine-tuned **WavLM Base+** (`microsoft/wavlm-base-plus`, 94M parameters), sliding-window temporal chunking (2.5s window, 50% overlap), and spectral acoustic feature extraction.
* **Sai Tanushree Singha** — *Text Forensics, Phishing & Chat Pre-Triage*  
  AI text identification via perplexity & burstiness heuristics, malicious URL lexical scoring, and chat export forensic parsing.
* **Simran Rao** — *Image Forensic Analysis*  
  Multi-stream image integrity verification combining **Error Level Analysis (ELA)** compression residue, **2D Fast Fourier Transform (FFT)** frequency domain analysis, and SSD facial landmark extraction.
* **Sridhar N** — *Video Deepfake Detection*  
  Spatio-temporal deepfake classification utilizing the **Video Vision Transformer (ViViT)** architecture trained on facial crop sequences across temporal frames.

---

## 📊 Verified Audio Benchmark Results
Evaluated on the benchmark **FoR (Fake or Real)** test partition (4,634 balanced audio samples):

| Metric | WavLM Base+ Fine-Tuned (4ensics) | Baseline CNN (Mel-Spectrogram) | Improvement |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **97.39%** | 79.28% | **+18.11%** |
| **Recall (Synthetic)** | **98.02%** | 60.46% | **+37.56%** |
| **Equal Error Rate (EER)** | **2.91%** | 21.05% | **-18.14%** |
| **ROC-AUC** | **99.58%** | 87.12% | **+12.46%** |
| **Precision** | **96.91%** | 94.21% | **+2.70%** |
| **F1-Score** | **97.46%** | 73.68% | **+23.78%** |

---

## 🧪 Demo Test Samples
Ready-to-use benchmark files are provided directly in the repository under [`demo_samples/audio/`](demo_samples/audio/):
- **Authentic Voice:** [`demo_samples/audio/real_voice_sample.wav`](demo_samples/audio/real_voice_sample.wav) — Clean human speech recording.
- **Synthetic Clone:** [`demo_samples/audio/synthetic_voice_sample.mp3`](demo_samples/audio/synthetic_voice_sample.mp3) — State-of-the-art voice synthesis (ElevenLabs).

---

## 🛠️ System Architecture & Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS, Lucide Icons
- **State & Storage:** Custom forensic store with dynamic risk engine

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Deep Learning:** PyTorch, Hugging Face Transformers (`WavLM`, `ViViT`)
- **Computer Vision:** OpenCV, NumPy, SciPy (FFT, ELA)
- **Database:** MySQL relational store for audit logging and chain-of-custody tracking

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+ with CUDA/PyTorch
- MySQL Server

### 2. Frontend Setup
```bash
git clone https://github.com/Adharv-pp/4ensics.git
cd 4ensics
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

### 3. Backend Setup
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python backend/backend.py
```
The backend API will start at `http://localhost:8000`.

---

## 📄 Academic Citation & Reference
Christ University Dept. of Computer Science — Multimodal Digital Forensics Pre-Triage Research Initiative (2025–2026).
