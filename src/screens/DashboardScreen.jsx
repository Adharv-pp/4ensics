import { useState, useEffect } from "react";
import {
  BarChart3,
  ShieldAlert,
  Clock,
  FileText,
  ChevronRight,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Topbar from "../components/Topbar";
import RiskBadge from "../components/RiskBadge";
import ScoreBar from "../components/ScoreBar";
import { forensicStore } from "../data/forensicStore";
import { STATUS_LABEL, FILE_ICON } from "../utils/constants";

export default function DashboardScreen({ onNavigate, user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    highRiskCount: 0,
    pendingCount: 0,
    activeCasesCount: 0,
    highRiskPct: 0,
    clearedCount: 0,
    reviewedCount: 0
  });
  const [timelineData, setTimelineData] = useState([]);
  const [distData, setDistData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    const data = forensicStore.getReports();
    setReports(data);
    setStats(forensicStore.getDashboardStats());
    setTimelineData(forensicStore.getTimelineData());
    setDistData(forensicStore.getDistributionData());
    
    const now = new Date();
    setLastUpdated(now.toUTCString().replace("GMT", "UTC"));
  };

  useEffect(() => {
    const unsub = forensicStore.subscribe(() => {
      loadData();
    });
    loadData();
    return unsub;
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 400);
  };

  const statCards = [
    {
      label: "Total Media Ingested",
      value: stats.totalFiles.toString(),
      delta: `${stats.clearedCount} cleared`,
      Icon: BarChart3,
      color: "#FF7A00",
      bg: "rgba(255,122,0,0.12)"
    },
    {
      label: "High Risk Flagged",
      value: stats.highRiskCount.toString(),
      delta: `${stats.highRiskPct}% of total ingest`,
      Icon: ShieldAlert,
      color: "#F44336",
      bg: "rgba(244,67,54,0.12)"
    },
    {
      label: "Pending Review Queue",
      value: stats.pendingCount.toString(),
      delta: stats.pendingCount > 0 ? "Awaiting triage" : "All cleared",
      Icon: Clock,
      color: "#FFC107",
      bg: "rgba(255,193,7,0.12)"
    },
    {
      label: "Active Forensic Cases",
      value: stats.activeCasesCount.toString(),
      delta: `${stats.reviewedCount} case files verified`,
      Icon: FileText,
      color: "#4CAF50",
      bg: "rgba(76,175,80,0.12)"
    },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title="Forensic Operations Dashboard"
        subtitle={`Live Operations Overview · Updated ${lastUpdated || "Just now"}`}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
        
        {/* Quick Actions Header Banner */}
        <div
          className="rounded-xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #161824 0%, #13151C 100%)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,122,0,0.15)", border: "1px solid rgba(255,122,0,0.3)" }}
            >
              <Sparkles size={20} color="#FF7A00" />
            </div>
            <div>
              <h2
                className="text-sm font-semibold text-white tracking-wide"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Multi-Modal Deepfake & Media Authentication
              </h2>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                ViViT transformer inference & ELA spectrogram pipeline active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigate("upload")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:opacity-90"
              style={{
                background: "#FF7A00",
                color: "#0D0E12",
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              <Upload size={13} strokeWidth={2.5} /> Ingest Media
            </button>

            <button
              onClick={() => forensicStore.exportCSV()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              style={{ background: "#1A1C25", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Download size={13} /> Export CSV
            </button>

            <button
              onClick={handleManualRefresh}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh Dashboard"
              style={{ background: "#1A1C25" }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-400" : ""} />
            </button>
          </div>
        </div>

        {/* Live Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, delta, Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl p-4 border transition-all hover:border-white/15"
              style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {label}
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: bg }}
                >
                  <Icon size={15} color={color} />
                </div>
              </div>
              <p
                className="text-2xl font-bold text-gray-100 tracking-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {value}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span>{delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Area Chart: 7-Day Trend */}
          <div
            className="xl:col-span-2 rounded-xl border p-5 flex flex-col justify-between"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="text-sm font-semibold text-gray-100"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Detection Risk Trend (7 Days)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Daily volume aggregated by classification tier
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-md font-medium border"
                style={{ background: "rgba(255,122,0,0.1)", color: "#FF7A00", borderColor: "rgba(255,122,0,0.2)" }}
              >
                Active Pipeline
              </span>
            </div>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F44336" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC107" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "#8F92A1", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8F92A1", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#161822",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontFamily: "DM Sans",
                      fontSize: 12,
                      color: "#E4E5EA",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.5)"
                    }}
                    cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Area type="monotone" dataKey="high" name="High Risk" stroke="#F44336" fill="url(#gHigh)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="medium" name="Medium Risk" stroke="#FFC107" fill="url(#gMed)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="low" name="Low Risk" stroke="#4CAF50" fill="url(#gLow)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/5">
              {[["#F44336", "High Risk (Flagged)"], ["#FFC107", "Medium Risk (Suspicious)"], ["#4CAF50", "Low Risk (Authentic)"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart: Risk Breakdown */}
          <div
            className="rounded-xl border p-5 flex flex-col justify-between"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div>
              <h3
                className="text-sm font-semibold text-gray-100"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Risk Composition
              </h3>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Current case distribution
              </p>
            </div>

            <div className="flex justify-center my-2">
              <PieChart width={140} height={140}>
                <Pie
                  data={distData}
                  cx={70}
                  cy={70}
                  innerRadius={45}
                  outerRadius={68}
                  dataKey="value"
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {distData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              {distData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>{d.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-gray-200">{d.value} files</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Submissions Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-sm"
          style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Recent Forensic Ingestions
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono">
                {reports.length} total
              </span>
            </div>
            
            <button
              onClick={() => onNavigate("reports")}
              className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium cursor-pointer"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              View Full Archive <ChevronRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr className="border-b" style={{ background: "#0F1017", borderColor: "rgba(255,255,255,0.06)" }}>
                  {["File & Hash", "Type", "Case ID", "Uploaded", "Risk Band", "AI Score", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((f) => {
                  const Icon = FILE_ICON[f.type] || FileText;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => onNavigate("file-detail", f.id)}
                      className="cursor-pointer transition-colors border-b hover:bg-white/[0.02]"
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center shrink-0">
                            <Icon size={14} color="#8F92A1" />
                          </div>
                          <div>
                            <span className="font-mono font-medium text-gray-200 block text-xs truncate max-w-xs">{f.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 block truncate max-w-xs">
                              {f.hash ? f.hash.substring(0, 16) + "…" : f.size}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 capitalize text-gray-300 font-medium">{f.type}</td>
                      
                      <td className="px-5 py-3 font-mono text-gray-300">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          {f.caseId}
                        </span>
                      </td>

                      <td className="px-5 py-3 font-mono text-gray-400">{f.uploadedAt}</td>

                      <td className="px-5 py-3">
                        <RiskBadge level={f.risk} />
                      </td>

                      <td className="px-5 py-3 w-32">
                        <ScoreBar score={f.score} />
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: STATUS_LABEL[f.status]?.color || "#8F92A1",
                            background: `${STATUS_LABEL[f.status]?.color || "#8F92A1"}15`
                          }}
                        >
                          {STATUS_LABEL[f.status]?.label || f.status}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate("file-detail", f.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-colors"
                          title="Open Forensic Dossier"
                        >
                          <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
