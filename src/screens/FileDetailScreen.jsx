import { useState } from "react";
import { ChevronRight, ShieldAlert, Flag, Download, Trash2, Info } from "lucide-react";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";
import { MOCK_FILES, DETECTION_SIGNALS } from "../data/mockData";
import { RISK_COLOR, FILE_ICON } from "../utils/constants";

export default function FileDetailScreen({ fileId, onBack }) {
  const file = MOCK_FILES.find((f) => f.id === fileId) ?? MOCK_FILES[0];
  const Icon = FILE_ICON[file.type];
  const [activeTab, setActiveTab] = useState("signals");

  const METADATA = {
    "File Name": file.name,
    "File Size": file.size,
    "MIME Type": "image/jpeg",
    "Dimensions": "4032 × 3024 px",
    "Created": "2026-07-29 08:14:22 UTC",
    "Modified": "2026-07-30 21:55:11 UTC",
    "GPS Embedded": "No",
    "Camera Model": "Not present",
    "Color Profile": "sRGB",
    "Compression": "Baseline DCT",
  };

  const HISTORY = [
    { ts: "2026-07-31 14:22", actor: "System", action: "File uploaded and queued for analysis" },
    { ts: "2026-07-31 14:24", actor: "AI Engine", action: "Analysis complete — High risk (score 94)" },
    { ts: "2026-07-31 14:30", actor: "Analyst Chen", action: "Flagged for human review" },
    { ts: "2026-07-31 14:45", actor: "Analyst Morris", action: "Added to case C-2026-0841" },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title={file.name}
        subtitle={`Case ${file.caseId} · Submitted ${file.uploadedAt}`}
      />
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
          <button onClick={onBack} className="transition-colors hover:text-orange-400">Reports</button>
          <ChevronRight size={12} />
          <span style={{ color: "#E4E5EA" }}>{file.name}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left: Preview + verdict */}
          <div className="flex flex-col gap-4">
            {/* Preview */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="aspect-video flex items-center justify-center"
                style={{ background: "#0D0E12" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon size={32} color="#3A3D4A" />
                  <span className="text-xs" style={{ color: "#3A3D4A", fontFamily: "'JetBrains Mono', monospace" }}>
                    PREVIEW UNAVAILABLE
                  </span>
                </div>
              </div>
              <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-mono truncate" style={{ color: "#8F92A1" }}>{file.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#3A3D4A" }}>{file.size}</p>
              </div>
            </div>

            {/* Risk verdict */}
            <div
              className="rounded-lg border p-4"
              style={{ background: "#13151C", borderColor: `${RISK_COLOR[file.risk]}30` }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                AI Authenticity Verdict
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center"
                  style={{ background: `${RISK_COLOR[file.risk]}15` }}
                >
                  <ShieldAlert size={20} color={RISK_COLOR[file.risk]} />
                </div>
                <div>
                  <p
                    className="text-xl font-bold leading-none"
                    style={{ fontFamily: "'Poppins', sans-serif", color: RISK_COLOR[file.risk] }}
                  >
                    {file.risk.toUpperCase()} RISK
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#8F92A1" }}>
                    Confidence score: <span className="font-mono" style={{ color: RISK_COLOR[file.risk] }}>{file.score}/100</span>
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${file.score}%`, background: RISK_COLOR[file.risk] }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                className="w-full py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
              >
                <Flag size={14} /> Flag for Review
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="py-2 rounded text-xs flex items-center justify-center gap-1.5"
                  style={{ background: "#1A1C25", color: "#8F92A1", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Download size={13} /> Export
                </button>
                <button
                  className="py-2 rounded text-xs flex items-center justify-center gap-1.5"
                  style={{ background: "#1A1C25", color: "#F44336", border: "1px solid rgba(244,67,54,0.2)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          </div>

          {/* Right: Tabs */}
          <div
            className="xl:col-span-2 rounded-lg border"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {["signals", "metadata", "history"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className="px-5 py-3 text-xs font-medium capitalize transition-all relative"
                  style={{
                    color: activeTab === t ? "#FF7A00" : "#8F92A1",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t === "signals" ? "Detection Signals" : t === "metadata" ? "File Metadata" : "Audit History"}
                  {activeTab === t && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: "#FF7A00" }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === "signals" && (
                <div>
                  <div className="flex items-start gap-3 mb-5 p-3 rounded" style={{ background: "rgba(244,67,54,0.07)", border: "1px solid rgba(244,67,54,0.15)" }}>
                    <Info size={14} color="#F44336" className="mt-0.5 shrink-0" />
                    <p className="text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                      Multiple high-confidence signals indicate this file has been AI-generated or significantly manipulated. Recommend escalation to senior forensic review before use in proceedings.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {DETECTION_SIGNALS.map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={s.status} />
                            <span className="text-xs font-mono w-7 text-right" style={{ color: RISK_COLOR[s.status] }}>{s.value}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${s.value}%`, background: RISK_COLOR[s.status] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "metadata" && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {Object.entries(METADATA).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-xs mb-0.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>{k}</span>
                      <span className="text-xs font-mono" style={{ color: "#E4E5EA" }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div className="flex flex-col gap-4">
                  {HISTORY.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: i === 0 ? "#FF7A00" : "#3A3D4A" }} />
                        {i < HISTORY.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.07)" }} />}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs font-mono mb-0.5" style={{ color: "#8F92A1" }}>{h.ts}</p>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "#FF7A00", fontFamily: "'DM Sans', sans-serif" }}>{h.actor}</p>
                        <p className="text-xs" style={{ color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}>{h.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
