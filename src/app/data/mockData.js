// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_FILES = [
  { id: "f001", name: "suspect_photo_01.jpg", type: "image", size: "3.2 MB", uploadedAt: "2026-07-31 14:22", risk: "high", score: 94, flaggedBy: "Analyst Chen", status: "flagged", caseId: "C-2026-0841" },
  { id: "f002", name: "interview_audio.mp3", type: "audio", size: "18.7 MB", uploadedAt: "2026-07-31 13:55", risk: "medium", score: 61, flaggedBy: "Analyst Reyes", status: "pending", caseId: "C-2026-0841" },
  { id: "f003", name: "cctv_clip_north_entrance.mp4", type: "video", size: "204 MB", uploadedAt: "2026-07-31 11:40", risk: "low", score: 12, flaggedBy: "—", status: "cleared", caseId: "C-2026-0839" },
  { id: "f004", name: "statement_doc_v2.txt", type: "text", size: "42 KB", uploadedAt: "2026-07-30 17:08", risk: "high", score: 87, flaggedBy: "Analyst Morris", status: "flagged", caseId: "C-2026-0835" },
  { id: "f005", name: "vehicle_photo_rear.jpg", type: "image", size: "5.1 MB", uploadedAt: "2026-07-30 15:31", risk: "medium", score: 55, flaggedBy: "—", status: "pending", caseId: "C-2026-0835" },
  { id: "f006", name: "phone_screen_capture.jpg", type: "image", size: "1.8 MB", uploadedAt: "2026-07-30 09:14", risk: "high", score: 91, flaggedBy: "Analyst Chen", status: "reviewed", caseId: "C-2026-0831" },
  { id: "f007", name: "crowd_analysis.mp4", type: "video", size: "512 MB", uploadedAt: "2026-07-29 22:07", risk: "low", score: 8, flaggedBy: "—", status: "cleared", caseId: "C-2026-0828" },
  { id: "f008", name: "witness_recording.mp3", type: "audio", size: "9.4 MB", uploadedAt: "2026-07-29 16:45", risk: "medium", score: 48, flaggedBy: "—", status: "pending", caseId: "C-2026-0828" },
];

export const TIMELINE_DATA = [
  { date: "Jul 25", high: 3, medium: 5, low: 9 },
  { date: "Jul 26", high: 7, medium: 8, low: 14 },
  { date: "Jul 27", high: 4, medium: 11, low: 20 },
  { date: "Jul 28", high: 9, medium: 6, low: 11 },
  { date: "Jul 29", high: 5, medium: 14, low: 18 },
  { date: "Jul 30", high: 12, medium: 9, low: 22 },
  { date: "Jul 31", high: 8, medium: 7, low: 15 },
];

export const DIST_DATA = [
  { name: "High Risk", value: 48, color: "#F44336" },
  { name: "Medium Risk", value: 61, color: "#FFC107" },
  { name: "Low Risk", value: 109, color: "#4CAF50" },
];

export const DETECTION_SIGNALS = [
  { label: "GAN artifact frequency", value: 87, status: "high" },
  { label: "Metadata inconsistency", value: 72, status: "high" },
  { label: "DCT coefficient anomaly", value: 64, status: "medium" },
  { label: "Noise pattern irregularity", value: 59, status: "medium" },
  { label: "Edge sharpness deviation", value: 41, status: "low" },
  { label: "Color histogram shift", value: 23, status: "low" },
];
