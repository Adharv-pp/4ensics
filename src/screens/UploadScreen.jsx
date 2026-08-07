import { useState } from "react";
import { Upload, CheckCircle2, X } from "lucide-react";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";

export default function UploadScreen() {
  const [dragOver, setDragOver] = useState(false);
  const [uploads] = useState([
    { name: "scene_photo_03.jpg", size: "4.7 MB", progress: 100, risk: "high", done: true },
    { name: "voice_memo.m4a", size: "11.2 MB", progress: 68, risk: null, done: false },
    { name: "evidence_doc.pdf", size: "2.1 MB", progress: 30, risk: null, done: false },
  ]);
  const [caseId, setCaseId] = useState("C-2026-0842");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Upload Files" subtitle="Submit media for AI-authenticity analysis" />
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-3xl mx-auto">
          {/* Case ID */}
          <div
            className="rounded-lg border p-4 mb-5"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                  Case Reference ID
                </label>
                <input
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full rounded px-3 py-2 text-sm font-mono outline-none"
                  style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA" }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                  Analysis Profile
                </label>
                <select
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <option>Standard Triage</option>
                  <option>Deep Forensic</option>
                  <option>Rapid Screen</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                  Priority
                </label>
                <select
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="rounded-lg border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-all mb-5"
            style={{
              borderColor: dragOver ? "#FF7A00" : "rgba(255,255,255,0.1)",
              background: dragOver ? "rgba(255,122,0,0.04)" : "#13151C",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: dragOver ? "rgba(255,122,0,0.15)" : "rgba(255,255,255,0.04)" }}
            >
              <Upload size={24} color={dragOver ? "#FF7A00" : "#8F92A1"} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#E4E5EA", fontFamily: "'Poppins', sans-serif" }}>
              Drop files to begin analysis
            </p>
            <p className="text-xs mb-4" style={{ color: "#8F92A1" }}>
              JPEG · PNG · MP4 · MOV · MP3 · WAV · TXT · PDF — max 2 GB per file
            </p>
            <button
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ background: "rgba(255,122,0,0.12)", color: "#FF7A00", border: "1px solid rgba(255,122,0,0.2)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Browse files
            </button>
          </div>

          {/* Upload queue */}
          {uploads.length > 0 && (
            <div
              className="rounded-lg border"
              style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                  Queue — {uploads.length} files
                </h3>
                <span className="text-xs font-mono" style={{ color: "#8F92A1" }}>18.0 MB total</span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {uploads.map((u, i) => {
                  const ext = u.name.split(".").pop().toUpperCase();
                  return (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0"
                        style={{ background: "#1E2029", color: "#8F92A1" }}
                      >
                        {ext}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono truncate" style={{ color: "#E4E5EA" }}>{u.name}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs" style={{ color: "#8F92A1" }}>{u.size}</span>
                            {u.done && u.risk && <RiskBadge level={u.risk} />}
                            {!u.done && (
                              <span className="text-xs font-mono" style={{ color: "#FF7A00" }}>{u.progress}%</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${u.progress}%`,
                              background: u.done
                                ? (u.risk === "high" ? "#F44336" : "#4CAF50")
                                : "#FF7A00",
                            }}
                          />
                        </div>
                      </div>
                      <button style={{ color: "#8F92A1" }}>
                        {u.done ? <CheckCircle2 size={15} color="#4CAF50" /> : <X size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <button
                  className="w-full py-2 rounded text-sm font-semibold"
                  style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
                >
                  Submit for Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
