import { Circle } from "lucide-react";
import { RISK_COLOR, RISK_BG } from "../utils/constants";

export default function RiskBadge({ level }) {
  if (!level) return null;
  const color = RISK_COLOR[level] || "#8F92A1";
  const bg = RISK_BG[level] || "rgba(255,255,255,0.06)";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wide"
      style={{ color, background: bg }}
    >
      <Circle size={5} fill={color} stroke="none" />
      {level}
    </span>
  );
}
