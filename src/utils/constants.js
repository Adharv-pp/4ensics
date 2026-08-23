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

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AVAILABLE_ROLES = [
  { value: "Administrator", label: "Administrator (Full Access)" },
  { value: "Forensic Analyst", label: "Forensic Analyst" },
  { value: "Senior Investigator", label: "Senior Investigator" },
  { value: "Digital Evidence Specialist", label: "Digital Evidence Specialist" },
  { value: "Supervisory Analyst", label: "Supervisory Analyst" },
  { value: "Detective", label: "Detective" },
  { value: "Investigating Officer", label: "Investigating Officer" }
];

export const getRoleMeta = (roleStr) => {
  if (!roleStr) return { label: "Analyst", badgeColor: "#8F92A1", bg: "rgba(143,146,161,0.12)", border: "rgba(143,146,161,0.25)", isAdmin: false };
  const normalized = roleStr.toLowerCase().trim();
  if (normalized === "admin" || normalized === "administrator" || normalized.includes("admin")) {
    return { label: "Administrator", badgeColor: "#FF7A00", bg: "rgba(255,122,0,0.15)", border: "rgba(255,122,0,0.35)", isAdmin: true };
  }
  if (normalized.includes("supervisor")) {
    return { label: "Supervisory Analyst", badgeColor: "#AB47BC", bg: "rgba(171,71,188,0.15)", border: "rgba(171,71,188,0.3)", isAdmin: false };
  }
  if (normalized.includes("senior")) {
    return { label: "Senior Investigator", badgeColor: "#42A5F5", bg: "rgba(66,165,245,0.15)", border: "rgba(66,165,245,0.3)", isAdmin: false };
  }
  if (normalized.includes("evidence")) {
    return { label: "Digital Evidence Specialist", badgeColor: "#7E57C2", bg: "rgba(126,87,194,0.15)", border: "rgba(126,87,194,0.3)", isAdmin: false };
  }
  if (normalized.includes("detective")) {
    return { label: "Detective", badgeColor: "#29B6F6", bg: "rgba(41,182,246,0.15)", border: "rgba(41,182,246,0.3)", isAdmin: false };
  }
  if (normalized.includes("investigat")) {
    return { label: "Investigating Officer", badgeColor: "#66BB6A", bg: "rgba(102,187,106,0.15)", border: "rgba(102,187,106,0.3)", isAdmin: false };
  }
  return { label: roleStr, badgeColor: "#26A69A", bg: "rgba(38,166,154,0.15)", border: "rgba(38,166,154,0.3)", isAdmin: false };
};
