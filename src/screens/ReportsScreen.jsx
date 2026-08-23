import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Layers
} from "lucide-react";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";
import ScoreBar from "../components/ScoreBar";
import { forensicStore } from "../data/forensicStore";
import { RISK_COLOR, RISK_BG, STATUS_LABEL, FILE_ICON } from "../utils/constants";

export default function ReportsScreen({ onNavigate, user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const unsub = forensicStore.subscribe((data) => {
      setReports(data || []);
    });
    return unsub;
  }, []);

  // Filter logic
  const filtered = reports.filter((f) => {
    const query = search.toLowerCase().trim();
    const matchSearch =
      !query ||
      (f.name && f.name.toLowerCase().includes(query)) ||
      (f.caseId && f.caseId.toLowerCase().includes(query)) ||
      (f.flaggedBy && f.flaggedBy.toLowerCase().includes(query)) ||
      (f.summary && f.summary.toLowerCase().includes(query)) ||
      (f.hash && f.hash.toLowerCase().includes(query));

    const matchRisk = riskFilter === "all" || f.risk === riskFilter;
    const matchType = typeFilter === "all" || f.type === typeFilter;
    const matchStatus = statusFilter === "all" || f.status === statusFilter;

    return matchSearch && matchRisk && matchType && matchStatus;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date-desc") return (b.timestamp || 0) - (a.timestamp || 0);
    if (sortBy === "date-asc") return (a.timestamp || 0) - (b.timestamp || 0);
    if (sortBy === "score-desc") return (b.score || 0) - (a.score || 0);
    if (sortBy === "score-asc") return (a.score || 0) - (b.score || 0);
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedReports = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    forensicStore.exportCSV(sorted);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this forensic case record?")) {
      forensicStore.deleteReport(id);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title="Forensic Evidence Archives"
        subtitle={`Total of ${reports.length} evidentiary files ingested across active agency investigations`}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-5">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8F92A1" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search filename, case ID, analyst, hash…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none border border-white/10 focus:border-orange-500/50 transition-colors"
              style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-white/10 bg-[#161822]">
              {["all", "high", "medium", "low"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRiskFilter(r);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer"
                  style={{
                    background: riskFilter === r ? (r === "all" ? "rgba(255,122,0,0.18)" : RISK_BG[r]) : "transparent",
                    color: riskFilter === r ? (r === "all" ? "#FF7A00" : RISK_COLOR[r]) : "#8F92A1",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {r === "all" ? "All Risk" : `${r} Risk`}
                </button>
              ))}
            </div>

            {/* Media Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-xs outline-none border border-white/10 cursor-pointer"
              style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="all">All Modalities</option>
              <option value="video">Videos</option>
              <option value="image">Images</option>
              <option value="audio">Audio Streams</option>
              <option value="text">Documents / Text</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-xs outline-none border border-white/10 cursor-pointer"
              style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="all">All Statuses</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="cleared">Cleared</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs outline-none border border-white/10 cursor-pointer"
              style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="score-desc">Highest AI Score</option>
              <option value="score-asc">Lowest AI Score</option>
              <option value="name-asc">Filename (A-Z)</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExport}
              title="Download CSV Dossier"
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              style={{ background: "#1A1C25", fontFamily: "'Poppins', sans-serif" }}
            >
              <FileSpreadsheet size={13} color="#4CAF50" /> Export CSV ({sorted.length})
            </button>
          </div>
        </div>

        {/* Master Forensic Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-lg"
          style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ background: "#0F1017", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["File & Integrity", "Type", "Case ID", "Ingestion Date", "Risk Level", "AI Authenticity", "Reviewer", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((f) => {
                  const Icon = FILE_ICON[f.type] || FILE_ICON.text;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => onNavigate("file-detail", f.id)}
                      className="cursor-pointer transition-colors border-b hover:bg-white/[0.02]"
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}
                    >
                      {/* Name & Hash */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <Icon size={16} color="#8F92A1" />
                          </div>
                          <div>
                            <span className="font-mono font-medium text-gray-200 block text-xs truncate max-w-xs">{f.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 block truncate max-w-xs">
                              {f.hash ? f.hash.substring(0, 20) + "…" : f.size}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5 capitalize text-gray-300 font-medium">{f.type}</td>
                      
                      {/* Case ID */}
                      <td className="px-5 py-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300">
                          {f.caseId}
                        </span>
                      </td>

                      {/* Upload Date */}
                      <td className="px-5 py-3.5 font-mono text-gray-400">{f.uploadedAt}</td>

                      {/* Risk Badge */}
                      <td className="px-5 py-3.5">
                        <RiskBadge level={f.risk} />
                      </td>

                      {/* Score Bar */}
                      <td className="px-5 py-3.5 w-32">
                        <ScoreBar score={f.score} />
                      </td>

                      {/* Flagged By */}
                      <td className="px-5 py-3.5 text-gray-400 font-medium">{f.flaggedBy || "System"}</td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block"
                          style={{
                            color: STATUS_LABEL[f.status]?.color || "#8F92A1",
                            background: `${STATUS_LABEL[f.status]?.color || "#8F92A1"}15`
                          }}
                        >
                          {STATUS_LABEL[f.status]?.label || f.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onNavigate("file-detail", f.id)}
                            title="Inspect File Dossier"
                            className="p-1 rounded text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, f.id)}
                            title="Delete Case Evidence"
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldAlert size={36} color="#8F92A1" className="mb-2 opacity-50" />
              <p className="text-sm font-semibold text-gray-300" style={{ fontFamily: "'Poppins', sans-serif" }}>
                No Evidence Files Found
              </p>
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Try adjusting your search keywords or filter criteria.
              </p>
            </div>
          )}

          {/* Pagination Footer */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-t bg-white/[0.01]"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs text-gray-400 font-mono">
              Showing {sorted.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className="w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: p === currentPage ? "rgba(255,122,0,0.18)" : "#1A1C25",
                    color: p === currentPage ? "#FF7A00" : "#8F92A1",
                    border: `1px solid ${p === currentPage ? "rgba(255,122,0,0.3)" : "rgba(255,255,255,0.05)"}`,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
