import { API_BASE_URL } from "../utils/constants";

// Helper for dynamic seed dates relative to current time
const now = new Date();
const formatDateTime = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const getRelativeDate = (hoursAgo) => {
  const d = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  return {
    formatted: formatDateTime(d),
    timestamp: d.getTime(),
  };
};

const SEED_0 = getRelativeDate(1.2);
const SEED_1 = getRelativeDate(2.5);
const SEED_2 = getRelativeDate(4.8);
const SEED_3 = getRelativeDate(18.0);
const SEED_4 = getRelativeDate(26.0);
const SEED_5 = getRelativeDate(44.0);
const SEED_6 = getRelativeDate(68.0);
const SEED_7 = getRelativeDate(92.0);

// ─── Initial Forensic Data (Dynamic Seed Cases) ──────────────────────────────
const INITIAL_REPORTS = [
  {
    id: "f001",
    name: "suspect_photo_01.jpg",
    type: "image",
    size: "3.2 MB",
    sizeBytes: 3355443,
    uploadedAt: SEED_0.formatted,
    timestamp: SEED_0.timestamp,
    risk: "high",
    score: 94,
    flaggedBy: "Analyst Chen",
    status: "flagged",
    caseId: "C-2026-0841",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    mimeType: "image/jpeg",
    dimensions: "4032 × 3024 px",
    summary: "High-probability GAN facial synthesis artifact detected in periocular and hair boundary regions.",
    signals: [
      { label: "GAN artifact frequency", value: 92, status: "high" },
      { label: "Metadata inconsistency", value: 88, status: "high" },
      { label: "DCT coefficient anomaly", value: 76, status: "high" },
      { label: "Noise pattern irregularity", value: 65, status: "medium" },
      { label: "Edge sharpness deviation", value: 48, status: "medium" },
      { label: "Color histogram shift", value: 24, status: "low" },
    ],
    metadata: {
      "File Name": "suspect_photo_01.jpg",
      "File Size": "3.2 MB",
      "MIME Type": "image/jpeg",
      "SHA-256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "Dimensions": "4032 × 3024 px",
      "Color Space": "sRGB (ICC Profile Embedded)",
      "Compression": "Baseline JPEG (Quality: 88)",
      "Exif GPS": "Stripped / Not present",
      "Analysis Pipeline": "ViViT Multi-Modal Image v2.1"
    },
    history: [
      { ts: SEED_0.formatted, actor: "System", action: "File ingested and queued for triage." },
      { ts: SEED_0.formatted, actor: "ViViT Engine", action: "Inference completed. Flagged as HIGH RISK (Confidence: 94%)." },
      { ts: SEED_0.formatted, actor: "Analyst Chen", action: "Marked as FLAGGED. Forwarded for senior investigator review." },
    ]
  },
  {
    id: "f002",
    name: "interview_audio.mp3",
    type: "audio",
    size: "18.7 MB",
    sizeBytes: 19608371,
    uploadedAt: SEED_1.formatted,
    timestamp: SEED_1.timestamp,
    risk: "medium",
    score: 61,
    flaggedBy: "Analyst Reyes",
    status: "pending",
    caseId: "C-2026-0841",
    hash: "a4f5b8236d910243e8d2e8541c88147d3902f232c4d6735e5d36e2f143719e7a",
    mimeType: "audio/mpeg",
    dimensions: "16:42 Duration (44.1 kHz)",
    summary: "Acoustic spectrogram reveals unnatural pitch micro-variations and potential neural voice cloning.",
    signals: [],
    metadata: {
      "File Name": "interview_audio.mp3",
      "File Size": "18.7 MB",
      "MIME Type": "audio/mpeg",
      "SHA-256": "a4f5b8236d910243e8d2e8541c88147d3902f232c4d6735e5d36e2f143719e7a",
      "Sampling Rate": "44,100 Hz (Stereo 192 kbps)",
      "Duration": "16 minutes 42 seconds",
      "Analysis Pipeline": "Acoustic Spectrogram & Neural Formant Analyzer"
    },
    history: [
      { ts: SEED_1.formatted, actor: "System", action: "Audio stream uploaded and queued." },
      { ts: SEED_1.formatted, actor: "AI Engine", action: "Acoustic analysis complete — Medium risk (score 61)." }
    ]
  },
  {
    id: "f003",
    name: "cctv_clip_north_entrance.mp4",
    type: "video",
    size: "204 MB",
    sizeBytes: 213909504,
    uploadedAt: SEED_2.formatted,
    timestamp: SEED_2.timestamp,
    risk: "low",
    score: 12,
    flaggedBy: "Automated",
    status: "cleared",
    caseId: "C-2026-0839",
    hash: "93b2a8d3e5f78c91a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
    mimeType: "video/mp4",
    dimensions: "1920 × 1080 @ 30fps",
    summary: "Consistent optical flow across all frames. No facial reenactment or deepfake frame artifacts detected.",
    signals: [
      { label: "ViViT Spatiotemporal anomaly", value: 12, status: "low" },
      { label: "Frame-to-frame optical flow", value: 9, status: "low" },
      { label: "Compression block boundary", value: 14, status: "low" },
    ],
    metadata: {
      "File Name": "cctv_clip_north_entrance.mp4",
      "File Size": "204 MB",
      "MIME Type": "video/mp4 (H.264 / AAC)",
      "SHA-256": "93b2a8d3e5f78c91a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
      "Resolution": "1920 × 1080 (Full HD)",
      "Frame Rate": "29.97 fps",
      "Analysis Pipeline": "ViViT Transformer Video Classification"
    },
    history: [
      { ts: SEED_2.formatted, actor: "System", action: "CCTV file uploaded." },
      { ts: SEED_2.formatted, actor: "ViViT Engine", action: "Deep scan finished. Video verified authentic (Score: 12%)." }
    ]
  },
  {
    id: "f004",
    name: "statement_doc_v2.txt",
    type: "document",
    size: "42 KB",
    sizeBytes: 43008,
    uploadedAt: SEED_3.formatted,
    timestamp: SEED_3.timestamp,
    risk: "high",
    score: 87,
    flaggedBy: "Analyst Morris",
    status: "flagged",
    caseId: "C-2026-0835",
    hash: "4a7d1ed414474e4033ac29ccb8653d9b1a03e1a8a25c11579df640032b4ab5f2",
    mimeType: "text/plain",
    dimensions: "1,420 words",
    summary: "High syntactic uniformity and low perplexity indicative of large language model text generation.",
    signals: [
      { label: "LLM Perplexity Index", value: 89, status: "high" },
      { label: "Burstiness Anomaly", value: 82, status: "high" },
      { label: "Type-Token Ratio (TTR)", value: 71, status: "high" },
    ],
    metadata: {
      "File Name": "statement_doc_v2.txt",
      "File Size": "42 KB",
      "MIME Type": "text/plain (UTF-8)",
      "SHA-256": "4a7d1ed414474e4033ac29ccb8653d9b1a03e1a8a25c11579df640032b4ab5f2",
      "Verdict": "AI-Generated",
      "AI Probability": "87.4%",
      "Human Probability": "12.6%",
      "Perplexity": "24.8",
      "Burstiness": "0.31",
      "TTR (Type-Token Ratio)": "0.42",
      "Analysis Pipeline": "RoBERTa Deep Neural Stylometry"
    },
    rawTextData: {
      verdict: "AI-Generated",
      ai_probability: 87.4,
      human_probability: 12.6,
      priority_score: 87.4,
      perplexity: 24.8,
      burstiness: 0.31,
      ttr: 0.42,
      style_score: 84.1,
      band: "HIGH PRIORITY",
      sentence_analysis: [
        {
          sentence: "In conclusion, it is important to remember that artificial intelligence plays a crucial role in modern computational paradigms",
          ai_score: 96.2
        },
        {
          sentence: "Furthermore, the utilization of advanced multi-layered neural architectures enables comprehensive statistical evaluation",
          ai_score: 91.5
        },
        {
          sentence: "The suspect was seen leaving the building at 10:45 PM on Tuesday night according to eyewitness testimony",
          ai_score: 18.4
        },
        {
          sentence: "Additionally, numerous factors must be carefully taken into consideration when assessing these empirical results",
          ai_score: 88.7
        },
        {
          sentence: "I walked over to the lobby counter and asked the security guard for the visitor logs",
          ai_score: 12.1
        }
      ]
    },
    history: [
      { ts: SEED_3.formatted, actor: "System", action: "Statement document uploaded." },
      { ts: SEED_3.formatted, actor: "NLP Engine", action: "Analysis completed. Flagged as High Risk (87%)." }
    ]
  },
  {
    id: "f005",
    name: "vehicle_photo_rear.jpg",
    type: "image",
    size: "5.1 MB",
    sizeBytes: 5347737,
    uploadedAt: SEED_4.formatted,
    timestamp: SEED_4.timestamp,
    risk: "medium",
    score: 55,
    flaggedBy: "System",
    status: "pending",
    caseId: "C-2026-0835",
    hash: "6e8f492a54b3e8c9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
    mimeType: "image/jpeg",
    dimensions: "3840 × 2160 px",
    summary: "Possible license plate digital inpainting / retouching detected in crop zone.",
    signals: [
      { label: "License Plate ELA Discrepancy", value: 68, status: "medium" },
      { label: "Edge sharpness deviation", value: 52, status: "medium" },
      { label: "Compression gradient noise", value: 45, status: "low" },
    ],
    metadata: {
      "File Name": "vehicle_photo_rear.jpg",
      "File Size": "5.1 MB",
      "MIME Type": "image/jpeg",
      "SHA-256": "6e8f492a54b3e8c9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
      "Dimensions": "3840 × 2160 px",
      "Analysis Pipeline": "ELA Local Inpainting Classifier"
    },
    history: [
      { ts: SEED_4.formatted, actor: "System", action: "Image ingested and queued." }
    ]
  },
  {
    id: "f006",
    name: "phone_screen_capture.jpg",
    type: "image",
    size: "1.8 MB",
    sizeBytes: 1887436,
    uploadedAt: SEED_5.formatted,
    timestamp: SEED_5.timestamp,
    risk: "high",
    score: 91,
    flaggedBy: "Analyst Chen",
    status: "reviewed",
    caseId: "C-2026-0831",
    hash: "7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e",
    mimeType: "image/jpeg",
    dimensions: "1170 × 2532 px",
    summary: "Font rendering kerning irregularities and digital cloning artifacts in chat bubble timestamps.",
    signals: [
      { label: "Font Kerning & Alignment Anomaly", value: 94, status: "high" },
      { label: "UI Layer Inpainting", value: 89, status: "high" },
      { label: "Lossy Compression Inconsistency", value: 78, status: "high" },
    ],
    metadata: {
      "File Name": "phone_screen_capture.jpg",
      "File Size": "1.8 MB",
      "MIME Type": "image/jpeg",
      "SHA-256": "7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e",
      "Dimensions": "1170 × 2532 px",
      "Analysis Pipeline": "Document & UI Forensic Analyzer"
    },
    history: [
      { ts: SEED_5.formatted, actor: "System", action: "Screenshot uploaded." },
      { ts: SEED_5.formatted, actor: "Analyst Chen", action: "Confirmed synthetic forgery. Status updated to REVIEWED." }
    ]
  },
  {
    id: "f007",
    name: "crowd_analysis.mp4",
    type: "video",
    size: "512 MB",
    sizeBytes: 536870912,
    uploadedAt: SEED_6.formatted,
    timestamp: SEED_6.timestamp,
    risk: "low",
    score: 8,
    flaggedBy: "Automated",
    status: "cleared",
    caseId: "C-2026-0828",
    hash: "2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    mimeType: "video/mp4",
    dimensions: "3840 × 2160 @ 60fps",
    summary: "No facial morphing or synthetic background insertion found. Authentic camera recording.",
    signals: [
      { label: "Temporal Coherence Score", value: 6, status: "low" },
      { label: "ViViT Deepfake Confidence", value: 8, status: "low" },
      { label: "Sensor Noise Fingerprint (PRNU)", value: 97, status: "low" },
    ],
    metadata: {
      "File Name": "crowd_analysis.mp4",
      "File Size": "512 MB",
      "MIME Type": "video/mp4",
      "SHA-256": "2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
      "Resolution": "3840 × 2160 (4K UHD)",
      "Frame Rate": "60.00 fps",
      "Analysis Pipeline": "ViViT Transformer Video Classification"
    },
    history: [
      { ts: SEED_6.formatted, actor: "System", action: "4K video ingested." },
      { ts: SEED_6.formatted, actor: "ViViT Engine", action: "Verified authentic (Score: 8%). Auto-cleared." }
    ]
  },
  {
    id: "f008",
    name: "witness_recording.mp3",
    type: "audio",
    size: "9.4 MB",
    sizeBytes: 9856614,
    uploadedAt: SEED_7.formatted,
    timestamp: SEED_7.timestamp,
    risk: "medium",
    score: 48,
    flaggedBy: "System",
    status: "pending",
    caseId: "C-2026-0828",
    hash: "1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    mimeType: "audio/mpeg",
    dimensions: "08:15 Duration (48 kHz)",
    summary: "Background acoustic reverb is consistent, but voice onset contains subtle compression anomalies.",
    signals: [
      { label: "Voice onset anomaly", value: 54, status: "medium" },
      { label: "Spectral envelope balance", value: 46, status: "medium" },
      { label: "Environmental noise continuity", value: 20, status: "low" },
    ],
    metadata: {
      "File Name": "witness_recording.mp3",
      "File Size": "9.4 MB",
      "MIME Type": "audio/mpeg",
      "SHA-256": "1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
      "Duration": "8 minutes 15 seconds",
      "Sampling Rate": "48,000 Hz",
      "Analysis Pipeline": "Acoustic Spectrogram & Neural Formant Analyzer"
    },
    history: [
      { ts: SEED_7.formatted, actor: "System", action: "Witness audio recorded and analyzed." }
    ]
  },
];

const STORAGE_KEY = "4ensics_reports_v3";
const SETTINGS_KEY = "4ensics_system_settings_v2";

// ─── Reactive Store State ──────────────────────────────────────────────────
let reportsState = [];
const subscribers = new Set();

function initStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      reportsState = JSON.parse(saved);
    } else {
      reportsState = [...INITIAL_REPORTS];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsState));
    }
  } catch (e) {
    console.warn("Could not read localStorage for reports, using memory:", e);
    reportsState = [...INITIAL_REPORTS];
  }
}
initStore();

function notify() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsState));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }
  subscribers.forEach((fn) => {
    try {
      fn(reportsState);
    } catch (e) {
      console.error("Subscriber notification error:", e);
    }
  });
}

// ─── Cryptographic Hash Helper (SHA-256) ───────────────────────────────────
export async function computeFileSHA256(file) {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.warn("SHA-256 calculation fallback:", e);
    return `hash_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }
}

// ─── Store API Methods ─────────────────────────────────────────────────────

export const forensicStore = {
  subscribe(fn) {
    subscribers.add(fn);
    fn(reportsState);
    return () => subscribers.delete(fn);
  },

  getReports() {
    return [...reportsState];
  },

  getReportById(id) {
    return reportsState.find((r) => r.id === id) || null;
  },

  addReport(newReport) {
    const currentTs = Date.now();
    const currentDate = new Date(currentTs);
    const uploadedStr = formatDateTime(currentDate);

    const reportWithDefaults = {
      ...newReport,
      id: newReport.id || `f_${currentTs.toString(36)}`,
      name: newReport.name || "unnamed_media",
      type: newReport.type || "video",
      size: newReport.size || "0 KB",
      sizeBytes: newReport.sizeBytes || 0,
      uploadedAt: newReport.uploadedAt || uploadedStr,
      timestamp: newReport.timestamp || currentTs,
      risk: newReport.risk || "low",
      score: newReport.score || 10,
      flaggedBy: newReport.flaggedBy || "AI Engine",
      status: newReport.status || (newReport.risk === "high" ? "flagged" : "pending"),
      caseId: newReport.caseId || `C-${currentDate.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      hash: newReport.hash || "computed_sha256_hash",
      mimeType: newReport.mimeType || "application/octet-stream",
      dimensions: newReport.dimensions || "N/A",
      summary: newReport.summary || newReport.verdictText || "Analysis completed.",
      signals: newReport.signals || [
        { label: "AI Feature Inconsistency", value: newReport.score || 10, status: newReport.risk || "low" },
        { label: "Noise pattern irregularity", value: Math.max(5, (newReport.score || 10) - 15), status: (newReport.score || 10) > 70 ? "high" : "low" }
      ],
      metadata: newReport.metadata || {
        "File Name": newReport.name,
        "File Size": newReport.size,
        "SHA-256": newReport.hash,
        "Uploaded Date": uploadedStr
      },
      history: newReport.history || [
        { ts: uploadedStr, actor: "System", action: "File submitted and processed." }
      ]
    };

    reportsState = [reportWithDefaults, ...reportsState];
    notify();
    return reportWithDefaults;
  },

  updateReportStatus(id, newStatus, reviewerName = "Lead Analyst", note = "") {
    const ts = formatDateTime(new Date());
    reportsState = reportsState.map((r) => {
      if (r.id === id) {
        const historyItem = {
          ts,
          actor: reviewerName,
          action: `Status updated to ${newStatus.toUpperCase()}.${note ? ` Note: ${note}` : ""}`
        };
        return {
          ...r,
          status: newStatus,
          flaggedBy: newStatus === "flagged" ? reviewerName : r.flaggedBy,
          history: [...(r.history || []), historyItem]
        };
      }
      return r;
    });
    notify();
  },

  deleteReport(id) {
    reportsState = reportsState.filter((r) => r.id !== id);
    notify();
  },

  resetDefaults() {
    reportsState = [...INITIAL_REPORTS];
    notify();
  },

  // ─── Dynamic Metrics & Aggregations ──────────────────────────────────────
  getDashboardStats() {
    const total = reportsState.length;
    const highRisk = reportsState.filter((r) => r.risk === "high").length;
    const pending = reportsState.filter((r) => r.status === "pending").length;
    const activeCases = new Set(reportsState.map((r) => r.caseId)).size;

    return {
      totalFiles: total,
      highRiskCount: highRisk,
      pendingCount: pending,
      activeCasesCount: activeCases,
      highRiskPct: total > 0 ? Math.round((highRisk / total) * 100) : 0,
      clearedCount: reportsState.filter((r) => r.status === "cleared").length,
      reviewedCount: reportsState.filter((r) => r.status === "reviewed").length,
    };
  },

  getTimelineData() {
    const daysMap = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      daysMap[dateStr] = { date: dateStr, high: 0, medium: 0, low: 0 };
    }

    reportsState.forEach((r) => {
      const d = r.timestamp ? new Date(r.timestamp) : new Date();
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (daysMap[dateStr]) {
        if (r.risk === "high") daysMap[dateStr].high += 1;
        else if (r.risk === "medium") daysMap[dateStr].medium += 1;
        else daysMap[dateStr].low += 1;
      }
    });

    return Object.values(daysMap);
  },

  getDistributionData() {
    let high = 0;
    let med = 0;
    let low = 0;

    reportsState.forEach((r) => {
      if (r.risk === "high") high++;
      else if (r.risk === "medium") med++;
      else low++;
    });

    return [
      { name: "High Risk", value: high, color: "#F44336" },
      { name: "Medium Risk", value: med, color: "#FFC107" },
      { name: "Low Risk", value: low, color: "#4CAF50" },
    ];
  },

  // ─── CSV Export Functionality ───────────────────────────────────────────
  exportCSV(filesToExport = null) {
    const list = filesToExport || reportsState;
    if (!list || list.length === 0) return false;

    const headers = [
      "ID",
      "File Name",
      "Media Type",
      "Case ID",
      "Risk Level",
      "AI Authenticity Score",
      "Status",
      "Flagged By",
      "Uploaded At",
      "SHA256 Hash",
      "MIME Type",
      "Summary"
    ];

    const rows = list.map((f) => [
      `"${f.id}"`,
      `"${(f.name || "").replace(/"/g, '""')}"`,
      `"${f.type}"`,
      `"${f.caseId}"`,
      `"${f.risk}"`,
      `"${f.score}"`,
      `"${f.status}"`,
      `"${(f.flaggedBy || "").replace(/"/g, '""')}"`,
      `"${f.uploadedAt}"`,
      `"${f.hash || ""}"`,
      `"${f.mimeType || ""}"`,
      `"${(f.summary || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `4ensics_forensic_reports_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  },

  // ─── Settings Preferences ───────────────────────────────────────────────
  getSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read settings from storage:", e);
    }
    return {
      notifications: true,
      autoFlag: true,
      threshold: 75,
      deepScanDefault: true,
      retentionDays: "90",
      audioSpectrogram: true,
      theme: "dark"
    };
  },

  saveSettings(newSettings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      return true;
    } catch (e) {
      console.warn("Could not save settings to storage:", e);
      return false;
    }
  }
};

export default forensicStore;
