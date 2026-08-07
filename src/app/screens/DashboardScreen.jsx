import {
  BarChart3,
  ShieldAlert,
  Clock,
  FileText,
  ChevronRight,
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
import { MOCK_FILES, TIMELINE_DATA, DIST_DATA } from "../data/mockData";
import { STATUS_LABEL, FILE_ICON } from "../utils/constants";

export default function DashboardScreen({ onNavigate }) {
  const statCards = [
    { label: "Files Processed (7d)", value: "218", delta: "+14%", Icon: BarChart3, color: "#FF7A00" },
    { label: "High Risk Flagged", value: "48", delta: "+6 today", Icon: ShieldAlert, color: "#F44336" },
    { label: "Pending Review", value: "31", delta: "3 urgent", Icon: Clock, color: "#FFC107" },
    { label: "Cases Active", value: "12", delta: "4 new", Icon: FileText, color: "#4CAF50" },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Dashboard" subtitle="Overview · Last updated 2026-07-31 14:38 UTC" />
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, delta, Icon, color }) => (
            <div
              key={label}
              className="rounded-lg p-4 border"
              style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                <div
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={14} color={color} />
                </div>
              </div>
              <p
                className="text-2xl font-bold"
                style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}
              >
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color }}>
                {delta}
              </p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          {/* Area chart */}
          <div
            className="xl:col-span-2 rounded-lg border p-4"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}
              >
                Risk Distribution — 7 Day Trend
              </h3>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,122,0,0.1)", color: "#FF7A00" }}>
                Jul 25–31
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={TIMELINE_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F44336" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC107" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "#8F92A1", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8F92A1", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontFamily: "DM Sans", fontSize: 12, color: "#E4E5EA" }}
                  cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <Area type="monotone" dataKey="high" stroke="#F44336" fill="url(#gHigh)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="medium" stroke="#FFC107" fill="url(#gMed)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="low" stroke="#4CAF50" fill="url(#gLow)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              {[["#F44336", "High"], ["#FFC107", "Medium"], ["#4CAF50", "Low"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 rounded-full" style={{ background: c }} />
                  <span className="text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie chart */}
          <div
            className="rounded-lg border p-4"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}
            >
              Risk Breakdown
            </h3>
            <div className="flex justify-center">
              <PieChart width={130} height={130}>
                <Pie data={DIST_DATA} cx={60} cy={60} innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {DIST_DATA.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {DIST_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>{d.name}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "#E4E5EA" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity table */}
        <div
          className="rounded-lg border"
          style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
              Recent Submissions
            </h3>
            <button
              onClick={() => onNavigate("reports")}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "#FF7A00" }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <table className="w-full text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["File", "Type", "Case ID", "Risk", "Score", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "#8F92A1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_FILES.slice(0, 5).map((f) => {
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
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Icon size={13} color="#8F92A1" />
                        <span className="font-mono text-xs" style={{ color: "#E4E5EA" }}>{f.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 capitalize" style={{ color: "#8F92A1" }}>{f.type}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "#8F92A1" }}>{f.caseId}</td>
                    <td className="px-4 py-2.5"><RiskBadge level={f.risk} /></td>
                    <td className="px-4 py-2.5 w-28"><ScoreBar score={f.score} /></td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium" style={{ color: STATUS_LABEL[f.status].color }}>
                        {STATUS_LABEL[f.status].label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
