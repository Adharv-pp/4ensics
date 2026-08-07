import { useState } from "react";
import { Search, Filter, Download, MoreHorizontal } from "lucide-react";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";
import ScoreBar from "../components/ScoreBar";
import { MOCK_FILES } from "../data/mockData";
import { RISK_COLOR, RISK_BG, STATUS_LABEL, FILE_ICON } from "../utils/constants";

export default function ReportsScreen({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = MOCK_FILES.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.caseId.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || f.risk === riskFilter;
    const matchType = typeFilter === "all" || f.type === typeFilter;
    return matchSearch && matchRisk && matchType;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Reports" subtitle="All processed files across active cases" />
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" color="#8F92A1" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename or case ID…"
              className="w-full pl-8 pr-3 py-2 rounded text-xs outline-none"
              style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.07)", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} color="#8F92A1" />
            {["all", "high", "medium", "low"].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-all"
                style={{
                  background: riskFilter === r ? (r === "all" ? "rgba(255,122,0,0.15)" : RISK_BG[r] ?? "rgba(255,122,0,0.15)") : "#1A1C25",
                  color: riskFilter === r ? (r === "all" ? "#FF7A00" : RISK_COLOR[r] ?? "#FF7A00") : "#8F92A1",
                  border: `1px solid ${riskFilter === r ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {r === "all" ? "All Risk" : r}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded text-xs outline-none"
            style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.07)", color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="all">All Types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="text">Text</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
              style={{ background: "#1A1C25", color: "#8F92A1", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <table className="w-full text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ background: "#0F1017", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["File Name", "Type", "Case ID", "Uploaded", "Risk", "AI Score", "Flagged By", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "#8F92A1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const Icon = FILE_ICON[f.type];
                return (
                  <tr
                    key={f.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onClick={() => onNavigate("file-detail", f.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={13} color="#8F92A1" />
                        <span className="font-mono" style={{ color: "#E4E5EA" }}>{f.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize" style={{ color: "#8F92A1" }}>{f.type}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#8F92A1" }}>{f.caseId}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#8F92A1" }}>{f.uploadedAt}</td>
                    <td className="px-4 py-3"><RiskBadge level={f.risk} /></td>
                    <td className="px-4 py-3 w-28"><ScoreBar score={f.score} /></td>
                    <td className="px-4 py-3" style={{ color: "#8F92A1" }}>{f.flaggedBy}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: STATUS_LABEL[f.status].color }}>
                        {STATUS_LABEL[f.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button style={{ color: "#8F92A1" }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm" style={{ color: "#8F92A1" }}>No files match the current filters.</p>
            </div>
          )}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs" style={{ color: "#8F92A1" }}>
              {filtered.length} of {MOCK_FILES.length} files
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className="w-6 h-6 flex items-center justify-center rounded text-xs"
                  style={{
                    background: p === 1 ? "rgba(255,122,0,0.15)" : "#1A1C25",
                    color: p === 1 ? "#FF7A00" : "#8F92A1",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
