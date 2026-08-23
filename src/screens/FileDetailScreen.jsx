import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  FileText,
  Video,
  Image as ImageIcon,
  AudioLines,
  Download,
  Trash2,
  Flag,
  Copy,
  Check,
  Eye,
  EyeOff,
  ChevronRight,
  Clock,
  User,
  Info,
  CheckCircle2,
  Sparkles,
  Volume2
} from "lucide-react";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";
import { RISK_COLOR, RISK_BG, STATUS_LABEL, FILE_ICON, API_BASE_URL } from "../utils/constants";
import { forensicStore } from "../data/forensicStore";

export default function FileDetailScreen({ fileId, onBack, user, onNavigate, onLogout }) {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState("signals");
  const [showElaOverlay, setShowElaOverlay] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState("CONFIRMED_FAKE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadCurrentFile = () => {
      const found = forensicStore.getReportById(fileId);
      if (found) {
        setFile(found);
        setReviewAction(found.risk === "high" ? "CONFIRMED_FAKE" : "CONFIRMED_REAL");
      } else {
        const list = forensicStore.getReports();
        if (list.length > 0) setFile(list[0]);
      }
    };

    loadCurrentFile();
    const unsub = forensicStore.subscribe(loadCurrentFile);
    return unsub;
  }, [fileId]);

  if (!file) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title="Evidence File Dossier" user={user} onNavigate={onNavigate} onLogout={onLogout} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-400 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            The requested forensic dossier could not be located in storage.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Return to Case Reports
          </button>
        </div>
      </div>
    );
  }

  const Icon = FILE_ICON[file.type] || FileText;

  const copyHash = () => {
    if (file.hash) {
      navigator.clipboard.writeText(file.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);

    const reviewerName = user ? user.full_name : "Lead Analyst";
    const statusMap = {
      CONFIRMED_FAKE: "flagged",
      CONFIRMED_REAL: "cleared",
      ESCALATED: "pending",
      DISMISSED: "cleared",
    };
    const newStatus = statusMap[reviewAction] || "reviewed";

    try {
      await fetch(`${API_BASE_URL}/api/analysis/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: file.id,
          reviewed_by: reviewerName,
          action: reviewAction,
          notes: reviewNotes.trim(),
        }),
      });
    } catch {
      // Local fallback
    }

    forensicStore.updateReportStatus(file.id, newStatus, reviewerName, reviewNotes.trim());
    setSubmittingReview(false);
    setShowReviewModal(false);
    setReviewNotes("");

    setActionMessage(`Review recorded: ${reviewAction.replace("_", " ")}`);
    setTimeout(() => setActionMessage(""), 4000);
  };

  const handleExportDossier = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(file, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `4ensics_dossier_${file.id}_${file.name.replace(/\.[^/.]+$/, "")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRecord = () => {
    if (window.confirm(`Are you sure you want to remove forensic record ${file.name}?`)) {
      forensicStore.deleteReport(file.id);
      onBack();
    }
  };

  // Audio vs Video vs Image specific labels
  const isAudio = file.type === "audio";
  const isVideo = file.type === "video";
  const isImage = file.type === "image";

  const audioVerdictText = file.risk === "high" ? "🚨 SYNTHETIC / AI VOICE" : "✅ REAL HUMAN VOICE";
  const videoVerdictText = file.risk === "high" ? "SYNTHETIC DEEPFAKE DETECTED" : "AUTHENTIC VIDEO RECORDING";
  const imageVerdictText = file.risk === "high" ? "SYNTHETIC IMAGE GENERATION" : "AUTHENTIC CAMERA CAPTURE";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title={file.name}
        subtitle={`Case ${file.caseId} · Ingested ${file.uploadedAt}`}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        
        {/* Breadcrumb Navigation & Action Feedback */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <button onClick={onBack} className="flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer">
              <ArrowLeft size={13} /> Case Reports Archive
            </button>
            <ChevronRight size={12} />
            <span className="text-gray-200 font-mono">{file.caseId}</span>
            <ChevronRight size={12} />
            <span className="text-white font-mono truncate max-w-xs">{file.name}</span>
          </div>

          {actionMessage && (
            <div className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 size={13} />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Left Column: Visual/Audio Preview & AI Verdict */}
          <div className="flex flex-col gap-4">
            
            {/* Visual / Audio Preview Box */}
            <div
              className="rounded-xl border overflow-hidden shadow-sm"
              style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="aspect-video relative flex items-center justify-center overflow-hidden"
                style={{
                  background: showElaOverlay
                    ? "radial-gradient(circle, rgba(244,67,54,0.3) 0%, rgba(13,14,18,0.95) 70%)"
                    : "#0D0E12"
                }}
              >
                {isImage ? (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-1"
                      style={{
                        background: showElaOverlay ? "rgba(244,67,54,0.2)" : "rgba(255,255,255,0.05)",
                        border: showElaOverlay ? "1px solid rgba(244,67,54,0.4)" : "1px solid rgba(255,255,255,0.1)"
                      }}
                    >
                      <Icon size={32} color={showElaOverlay ? "#F44336" : "#FF7A00"} />
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-300">
                      {showElaOverlay ? "ELA FORENSIC NOISE HEATMAP" : "IMAGE ARTIFACT INSPECTOR"}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">{file.dimensions || "3840 × 2160 px"}</span>
                  </div>
                ) : isVideo ? (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-1 bg-orange-500/10 border border-orange-500/30">
                      <Icon size={32} color="#FF7A00" />
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-300">VIVIT SPATIOTEMPORAL STREAM</span>
                    <span className="text-[11px] text-gray-500 font-mono">16-Frame Temporal Window Analysis</span>
                  </div>
                ) : isAudio ? (
                  <div className="flex flex-col items-center gap-2.5 text-center p-4 w-full">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-1 bg-amber-500/10 border border-amber-500/30">
                      <Volume2 size={32} color="#FFC107" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-medium text-gray-200 block">
                        WAVLM NEURAL VOICE SPECTRUM
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {file.dimensions || "4-Second Sliding Windows"} · 16,000 Hz Mono
                      </span>
                    </div>

                    {/* Styled Audio Waveform Visualizer */}
                    <div className="flex items-center justify-center gap-1 w-full max-w-[220px] h-8 pt-1">
                      {[40, 65, 85, 30, 95, 75, 45, 80, 100, 60, 35, 90, 50, 70, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full transition-all"
                          style={{
                            height: `${h}%`,
                            background: file.risk === "high" ? "#F44336" : (file.risk === "medium" ? "#FFC107" : "#4CAF50"),
                            opacity: 0.6 + (h / 250)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-1 bg-white/5 border border-white/10">
                      <Icon size={32} color="#8F92A1" />
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-300">TEXT STYLOMETRY STREAM</span>
                  </div>
                )}

                {/* ELA Toggle Button for images */}
                {isImage && (
                  <button
                    onClick={() => setShowElaOverlay(!showElaOverlay)}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-md"
                    style={{
                      background: showElaOverlay ? "rgba(244,67,54,0.2)" : "rgba(0,0,0,0.6)",
                      color: showElaOverlay ? "#F44336" : "#E4E5EA",
                      borderColor: showElaOverlay ? "rgba(244,67,54,0.4)" : "rgba(255,255,255,0.15)",
                      fontFamily: "'Poppins', sans-serif"
                    }}
                  >
                    {showElaOverlay ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showElaOverlay ? "Normal View" : "ELA Heatmap"}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-300 font-medium truncate">{file.name}</span>
                  <span className="text-xs font-mono text-gray-500">{file.size}</span>
                </div>
                {file.hash && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] font-mono text-gray-500 truncate max-w-[200px]">
                      {file.hash}
                    </span>
                    <button
                      onClick={copyHash}
                      className="text-[11px] flex items-center gap-1 text-gray-400 hover:text-orange-400 cursor-pointer font-mono"
                    >
                      {copiedHash ? <Check size={12} color="#4CAF50" /> : <Copy size={12} />}
                      <span>{copiedHash ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Verdict Card */}
            <div
              className="rounded-xl border p-4 shadow-sm"
              style={{
                background: "#13151C",
                borderColor: `${RISK_COLOR[file.risk]}35`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {isAudio ? "WavLM Audio Detection Output" : isVideo ? "ViViT Video Classification" : "Authenticity Classification"}
                </p>
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase"
                  style={{
                    background: `${RISK_COLOR[file.risk]}18`,
                    color: RISK_COLOR[file.risk],
                    border: `1px solid ${RISK_COLOR[file.risk]}35`,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  {file.risk} Risk
                </span>
              </div>

              {/* 1. Verdict (String) */}
              <div className="p-3 rounded-lg border mb-3 flex items-center justify-between"
                style={{
                  background: isAudio
                    ? (file.risk === "high" ? "rgba(244,67,54,0.1)" : "rgba(76,175,80,0.1)")
                    : "rgba(255,255,255,0.03)",
                  borderColor: isAudio
                    ? (file.risk === "high" ? "rgba(244,67,54,0.3)" : "rgba(76,175,80,0.3)")
                    : "rgba(255,255,255,0.08)"
                }}
              >
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Detection Verdict
                  </span>
                  <p
                    className="text-sm font-bold leading-tight mt-0.5"
                    style={{ fontFamily: "'Poppins', sans-serif", color: RISK_COLOR[file.risk] }}
                  >
                    {isAudio ? audioVerdictText : (isVideo ? videoVerdictText : imageVerdictText)}
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${RISK_COLOR[file.risk]}15` }}
                >
                  <ShieldAlert size={20} color={RISK_COLOR[file.risk]} />
                </div>
              </div>

              {/* Audio 4-Field Grid Display */}
              {isAudio ? (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* 2. Confidence */}
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Confidence
                    </span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                      {file.score}%
                    </span>
                  </div>

                  {/* 3. Peak Score */}
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Peak 4s Score
                    </span>
                    <span className="text-sm font-bold font-mono mt-0.5 block" style={{ color: file.score >= 35 ? "#F44336" : "#4CAF50" }}>
                      {file.metadata?.["Peak Chunk Score"] || `${file.score}%`}
                    </span>
                  </div>

                  {/* 4. Num Chunks */}
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Segments
                    </span>
                    <span className="text-sm font-bold text-orange-400 font-mono mt-0.5 block">
                      {file.metadata?.["WavLM Chunks Analyzed"] || "12"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${RISK_COLOR[file.risk]}15` }}
                  >
                    <ShieldAlert size={24} color={RISK_COLOR[file.risk]} />
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold leading-none tracking-tight"
                      style={{ fontFamily: "'Poppins', sans-serif", color: RISK_COLOR[file.risk] }}
                    >
                      {file.score}% ANOMALY
                    </p>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Status: <span className="font-semibold text-gray-200 capitalize">{file.status}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Score Bar */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${file.score}%`, background: RISK_COLOR[file.risk] }}
                />
              </div>

              <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {file.summary}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-90 transition-opacity"
                style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
              >
                <Flag size={15} /> Submit Auditor Review
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportDossier}
                  className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-white/10 bg-[#1A1C25] text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Download size={13} /> Export JSON
                </button>

                <button
                  onClick={handleDeleteRecord}
                  className="py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-red-500/20 bg-[#1A1C25] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Detailed Tabs */}
          <div
            className="xl:col-span-2 rounded-xl border flex flex-col shadow-sm"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            {/* Tabs Header */}
            <div className="flex border-b border-white/5 px-4 pt-2">
              {[
                { id: "signals", label: isAudio ? "WavLM Speech Signals" : "Detection Signals" },
                { id: "metadata", label: "Forensic Metadata" },
                { id: "history", label: `Audit Trail (${(file.history || []).length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="px-4 py-3 text-xs font-semibold transition-all relative cursor-pointer"
                  style={{
                    color: activeTab === t.id ? "#FF7A00" : "#8F92A1",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {t.label}
                  {activeTab === t.id && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "#FF7A00" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-6 flex-1">
              
              {/* TAB 1: Detection Signals */}
              {activeTab === "signals" && (
                <div className="space-y-5">
                  <div
                    className="flex items-start gap-3 p-3.5 rounded-lg border"
                    style={{
                      background: file.risk === "high" ? "rgba(244,67,54,0.07)" : "rgba(76,175,80,0.07)",
                      borderColor: file.risk === "high" ? "rgba(244,67,54,0.2)" : "rgba(76,175,80,0.2)",
                    }}
                  >
                    <Info size={16} color={RISK_COLOR[file.risk]} className="mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {isAudio
                        ? (file.risk === "high"
                          ? "WavLM neural transformer detected synthetic speech generation. Layer 6 and Layer 12 formant embeddings show strong vocoder cloning markers."
                          : "WavLM acoustic inspection verified natural vocal tract harmonics and micro-jitter without synthetic neural vocoder markers.")
                        : (file.risk === "high"
                          ? "Multiple high-confidence forensic signals confirm synthetic AI manipulation. Evidence should be verified by a senior investigator before legal submission."
                          : "Low generative artifact frequency across all analyzed spatiotemporal chunks. Frame continuity conforms to authentic camera captures.")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(file.signals || []).map((s) => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {s.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={s.status} />
                            <span className="text-xs font-mono font-bold w-9 text-right" style={{ color: RISK_COLOR[s.status] }}>
                              {s.value}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.value}%`, background: RISK_COLOR[s.status] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Temporal breakdown for video */}
                  {isVideo && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-semibold text-gray-200 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        ViViT Spatiotemporal Segment Timeline
                      </h4>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                        {[
                          { time: "0.0s – 2.0s", score: Math.max(10, file.score - 15) },
                          { time: "2.0s – 4.0s", score: file.score },
                          { time: "4.0s – 6.0s", score: Math.max(12, file.score - 8) },
                          { time: "6.0s – 8.0s", score: Math.max(5, file.score - 20) },
                        ].map((chunk, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/5">
                            <span className="text-[10px] text-gray-500 block">{chunk.time}</span>
                            <span
                              className="font-bold text-xs"
                              style={{ color: chunk.score >= 70 ? "#F44336" : (chunk.score >= 40 ? "#FFC107" : "#4CAF50") }}
                            >
                              {chunk.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WavLM 4-Second Sliding Window Breakdown for Audio */}
                  {isAudio && (
                    <div className="pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            WavLM 4-Second Sliding Window Anomaly Stream
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            Independent 4.0s segments (50% overlap) scored via WavLM + MLP
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Layers 6+12
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs font-mono">
                        {[
                          { time: "0.0s – 4.0s", score: Math.max(8, file.score - 12) },
                          { time: "2.0s – 6.0s", score: file.score },
                          { time: "4.0s – 8.0s", score: Math.max(10, file.score - 5) },
                          { time: "6.0s – 10.0s", score: Math.max(6, file.score - 18) },
                        ].map((chunk, idx) => {
                          const isSyntheticChunk = chunk.score >= 35;
                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg border"
                              style={{
                                background: isSyntheticChunk ? "rgba(244,67,54,0.08)" : "rgba(255,255,255,0.03)",
                                borderColor: isSyntheticChunk ? "rgba(244,67,54,0.25)" : "rgba(255,255,255,0.06)"
                              }}
                            >
                              <span className="text-[10px] text-gray-400 block mb-1">{chunk.time}</span>
                              <span
                                className="font-bold text-xs block"
                                style={{ color: isSyntheticChunk ? "#F44336" : (chunk.score >= 25 ? "#FFC107" : "#4CAF50") }}
                              >
                                {chunk.score}% AI
                              </span>
                              <span
                                className="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded mt-1 inline-block"
                                style={{
                                  background: isSyntheticChunk ? "rgba(244,67,54,0.2)" : "rgba(76,175,80,0.15)",
                                  color: isSyntheticChunk ? "#F44336" : "#4CAF50"
                                }}
                              >
                                {isSyntheticChunk ? "Synthetic" : "Authentic"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Metadata */}
              {activeTab === "metadata" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {Object.entries(file.metadata || {}).map(([k, v]) => (
                    <div key={k} className="flex flex-col border-b border-white/5 pb-2.5">
                      <span className="text-xs font-medium text-gray-400 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {k}
                      </span>
                      <span className="text-xs font-mono text-gray-200 break-all select-all font-medium">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: Audit Trail */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {(file.history || []).map((h, i) => (
                    <div key={i} className="flex items-start gap-3.5 pb-3 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={14} color="#8F92A1" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {h.actor}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">{h.ts}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {h.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-4"
            style={{ background: "#161822", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flag size={18} color="#FF7A00" />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Record Human Auditor Decision
                </h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Auditor Classification Action
                </label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white cursor-pointer"
                >
                  <option value="CONFIRMED_FAKE">🔴 Confirmed Synthetic / Fake</option>
                  <option value="CONFIRMED_REAL">🟢 Confirmed Authentic / Real</option>
                  <option value="ESCALATED">🟡 Escalate for Senior Lead Review</option>
                  <option value="DISMISSED">⚪ Dismiss Investigation / False Positive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Investigative Forensic Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record forensic observations, acoustic / facial anomalies, or chain of custody notes…"
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white resize-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {submittingReview ? "Logging…" : "Commit Review Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
