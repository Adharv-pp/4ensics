import {
  Image,
  Video,
  AudioLines,
  FileType2,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const RISK_COLOR = {
  high: "#F44336",
  medium: "#FFC107",
  low: "#4CAF50",
};

export const RISK_BG = {
  high: "rgba(244,67,54,0.12)",
  medium: "rgba(255,193,7,0.12)",
  low: "rgba(76,175,80,0.12)",
};

export const STATUS_LABEL = {
  pending: { label: "Pending", color: "#8F92A1" },
  reviewed: { label: "Reviewed", color: "#4CAF50" },
  flagged: { label: "Flagged", color: "#F44336" },
  cleared: { label: "Cleared", color: "#4CAF50" },
};

export const FILE_ICON = {
  image: Image,
  video: Video,
  audio: AudioLines,
  text: FileType2,
};
