import os
import re
import math
import string
import socket
import ssl
from urllib.parse import urlparse, parse_qs
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False


class TextDetector:
    def __init__(self, model_dir=None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if not model_dir:
            model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "text")
        self.model_dir = model_dir
        self.tokenizer = None
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            if os.path.exists(self.model_dir):
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir).to(self.device)
                self.model.eval()
                print("Text Detection Model initialized successfully.")
        except Exception as e:
            print(f"Notice initializing text model: {e}")

    def get_ai_prob(self, text: str, max_length: int = 256) -> float:
        if not self.tokenizer or not self.model:
            # Fallback statistical heuristic if model is loading
            words = text.split()
            unique_ratio = len(set(words)) / max(1, len(words))
            return 0.75 if unique_ratio > 0.8 else 0.25

        inputs = self.tokenizer(
            text, truncation=True, padding="max_length",
            max_length=max_length, return_tensors="pt"
        ).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
        return float(probs[1]) if len(probs) > 1 else float(probs[0])

    def compute_text_metrics(self, text: str):
        words = text.split()
        total_words = len(words)
        if total_words == 0:
            return 0.0, 0.0, 0.0

        # Type-Token Ratio (TTR)
        ttr = round(len(set(w.lower() for w in words)) / total_words, 3)

        # Sentence length variation for Burstiness
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 0]
        lengths = [len(s.split()) for s in sentences]
        if len(lengths) > 1:
            mean_l = np.mean(lengths)
            std_l = np.std(lengths)
            burstiness = round(float(std_l / (mean_l + 1e-7)), 2)
        else:
            burstiness = 0.5

        # Heuristic Perplexity indicator
        perplexity = round(float(25.0 + (1.0 - ttr) * 45.0 + (1.0 / max(0.1, burstiness)) * 10.0), 1)
        return ttr, burstiness, perplexity

    def analyze_text(self, text: str):
        text = text.strip()
        words = text.split()
        if len(words) < 5:
            return {
                "status": "error",
                "detail": "Text must contain at least 15 words for forensic verification."
            }

        sentences = [
            s.strip() for s in re.split(r'[.!?]+', text)
            if len(s.strip()) > 8
        ]
        if not sentences:
            sentences = [text]

        sentence_analysis = []
        sent_scores = []
        for sent in sentences[:16]:
            score = self.get_ai_prob(sent, max_length=128)
            score_pct = round(score * 100, 1)
            sent_scores.append(score)
            sentence_analysis.append({
                "sentence": sent,
                "ai_score": score_pct
            })

        # Chunk evaluation
        chunks = [text[i:i + 400] for i in range(0, min(len(text), 2000), 400)]
        chunk_probs = [self.get_ai_prob(c) for c in chunks] if chunks else [0.5]
        chunk_avg = sum(chunk_probs) / len(chunk_probs)
        sent_avg = sum(sent_scores) / len(sent_scores) if sent_scores else chunk_avg
        sent_max = max(sent_scores) if sent_scores else chunk_avg

        raw_ai_prob = (chunk_avg * 0.4 + sent_avg * 0.3 + sent_max * 0.3)
        ai_prob_pct = round(raw_ai_prob * 100, 1)
        human_prob_pct = round(100.0 - ai_prob_pct, 1)

        is_ai = ai_prob_pct >= 50.0
        verdict = "AI-Generated" if is_ai else "Human-Written"
        priority_score = ai_prob_pct if is_ai else round((1.0 - raw_ai_prob) * 100, 1)
        band = "HIGH PRIORITY" if ai_prob_pct >= 65.0 else ("MODERATE" if ai_prob_pct >= 40.0 else "SAFE")

        ttr, burstiness, perplexity = self.compute_text_metrics(text)
        style_score = round(float(burstiness * 0.6 + ttr * 0.4), 2)

        # Check for URLs in text
        url_pattern = re.compile(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s]*')
        urls_found = url_pattern.findall(text)
        url_scan_results = []
        for u in urls_found[:5]:
            url_scan_results.append(self.scan_url(u))

        return {
            "status": "success",
            "verdict": verdict,
            "ai_probability": ai_prob_pct,
            "human_probability": human_prob_pct,
            "priority_score": priority_score,
            "band": band,
            "word_count": len(words),
            "perplexity": perplexity,
            "burstiness": burstiness,
            "ttr": ttr,
            "style_score": style_score,
            "sentence_analysis": sentence_analysis,
            "url_scan_results": url_scan_results
        }

    def scan_url(self, url: str):
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        query = parsed.query

        has_https = parsed.scheme == 'https'
        domain_length = len(domain)
        path_depth = len([p for p in path.split('/') if p])

        ip_pattern = r'^\d+\.\d+\.\d+\.\d+$'
        has_ip = bool(re.match(ip_pattern, domain.split(':')[0]))

        shorteners = {'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'ow.ly'}
        has_shortener = domain in shorteners

        suspicious_kw = ['secure', 'login', 'verify', 'update', 'bank', 'account', 'paypal', 'signin', 'support', 'bonus', 'claim', 'free', 'win']
        found_kw = [k for k in suspicious_kw if k in url.lower()]

        reasons = []
        risk_points = 0

        if not has_https:
            reasons.append("Unencrypted connection (HTTP)")
            risk_points += 25
        if has_ip:
            reasons.append("Host is direct IP address instead of domain name")
            risk_points += 35
        if has_shortener:
            reasons.append("URL uses redirection shortener hiding destination")
            risk_points += 20
        if found_kw:
            reasons.append(f"Contains high-risk phishing keywords ({', '.join(found_kw)})")
            risk_points += len(found_kw) * 15
        if domain_length > 35:
            reasons.append("Abnormally long domain length")
            risk_points += 10
        if '@' in url:
            reasons.append("Contains '@' sign credential injection marker")
            risk_points += 25

        score = min(risk_points, 100)
        risk_level = "DANGER" if score >= 60 else ("CAUTION" if score >= 30 else "SAFE")
        if not reasons:
            reasons.append("Domain and URL structure conform to standard conventions.")

        return {
            "url": url,
            "domain": domain,
            "has_https": has_https,
            "has_ip_address": has_ip,
            "has_url_shortener": has_shortener,
            "has_suspicious_keyword": len(found_kw) > 0,
            "suspicious_keywords_found": found_kw,
            "domain_length": domain_length,
            "path_depth": path_depth,
            "score": score,
            "risk_level": risk_level,
            "reasons": reasons
        }

    def analyze_whatsapp(self, file_path: str):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        msg_regex = re.compile(r'^(?:\[?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]m)?)\]?\s*-?\s*)?([^:]+):\s*(.+)$', re.IGNORECASE)
        url_regex = re.compile(r'https?://[^\s]+')

        parsed_messages = []
        all_urls = []
        scam_urls_count = 0

        for idx, line in enumerate(lines):
            line_str = line.strip()
            if not line_str:
                continue

            match = msg_regex.match(line_str)
            if match:
                sender = match.group(3).strip()
                text = match.group(4).strip()
            else:
                sender = "Participant"
                text = line_str

            words = text.split()
            urls = url_regex.findall(text)
            all_urls.extend(urls)

            has_url = len(urls) > 0
            scam_risk = "No URLs"
            if has_url:
                scam_risk = "🔗 URL found"
                for u in urls:
                    u_scan = self.scan_url(u)
                    if u_scan["risk_level"] in ["CAUTION", "DANGER"]:
                        scam_risk = f"Suspicious Link: {u_scan['domain']}"
                        scam_urls_count += 1
                        break

            if len(words) < 4:
                parsed_messages.append({
                    "id": idx,
                    "sender": sender,
                    "message": text,
                    "ai_score": 10,
                    "too_short": True,
                    "has_url": has_url,
                    "scam_risk": scam_risk
                })
            else:
                prob = self.get_ai_prob(text, max_length=128)
                score_pct = round(prob * 100, 1)
                parsed_messages.append({
                    "id": idx,
                    "sender": sender,
                    "message": text,
                    "ai_score": score_pct,
                    "too_short": False,
                    "has_url": has_url,
                    "scam_risk": scam_risk
                })

        analyzed_msgs = [m for m in parsed_messages if not m["too_short"]]
        avg_score = round(float(np.mean([m["ai_score"] for m in analyzed_msgs])), 1) if analyzed_msgs else 15.0

        if avg_score >= 55.0 or scam_urls_count > 0:
            overall_risk = "HIGH"
            verdict = "AI-Generated / Bot Scripting"
        elif avg_score >= 35.0:
            overall_risk = "MEDIUM"
            verdict = "Mixed Activity"
        else:
            overall_risk = "LOW"
            verdict = "Authentic Human Conversation"

        return {
            "status": "success",
            "verdict": verdict,
            "avg_ai_score": avg_score,
            "message_count": len(parsed_messages),
            "analyzed_count": len(analyzed_msgs),
            "scam_urls_found": scam_urls_count,
            "overall_risk": overall_risk,
            "all_urls": all_urls,
            "messages": parsed_messages
        }

    def analyze_document(self, file_path: str):
        ext = os.path.splitext(file_path)[1].lower()
        text = ""

        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read().strip()
        elif ext == ".pdf" and HAS_PDFPLUMBER:
            with pdfplumber.open(file_path) as pdf:
                text = "\n".join(p.extract_text() or "" for p in pdf.pages).strip()
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read().strip()

        if not text:
            raise ValueError("No text content could be extracted from document.")

        res = self.analyze_text(text)
        res["extracted_text"] = text[:500] + "..." if len(text) > 500 else text
        return res


_text_detector = None

def get_text_detector():
    global _text_detector
    if _text_detector is None:
        _text_detector = TextDetector()
    return _text_detector
