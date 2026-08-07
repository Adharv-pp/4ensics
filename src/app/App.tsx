import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Image,
  Video,
  AudioLines,
  FileType2,
  ChevronRight,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  RefreshCw,
  Flag,
  X,
  Plus,
  Bell,
  ChevronDown,
  Info,
  BarChart3,
  Cpu,
  TrendingUp,
  Circle,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | "login"
  | "forgot-password"
  | "request-access"
  | "dashboard"
  | "upload"
  | "reports"
  | "file-detail"
  | "settings";

type RiskLevel = "high" | "medium" | "low";

interface FileRecord {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "text";
  size: string;
  uploadedAt: string;
  risk: RiskLevel;
  score: number;
  flaggedBy: string;
  status: "pending" | "reviewed" | "flagged" | "cleared";
  caseId: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MOCK_FILES: FileRecord[] = [
  { id: "f001", name: "suspect_photo_01.jpg", type: "image", size: "3.2 MB", uploadedAt: "2026-07-31 14:22", risk: "high", score: 94, flaggedBy: "Analyst Chen", status: "flagged", caseId: "C-2026-0841" },
  { id: "f002", name: "interview_audio.mp3", type: "audio", size: "18.7 MB", uploadedAt: "2026-07-31 13:55", risk: "medium", score: 61, flaggedBy: "Analyst Reyes", status: "pending", caseId: "C-2026-0841" },
  { id: "f003", name: "cctv_clip_north_entrance.mp4", type: "video", size: "204 MB", uploadedAt: "2026-07-31 11:40", risk: "low", score: 12, flaggedBy: "—", status: "cleared", caseId: "C-2026-0839" },
  { id: "f004", name: "statement_doc_v2.txt", type: "text", size: "42 KB", uploadedAt: "2026-07-30 17:08", risk: "high", score: 87, flaggedBy: "Analyst Morris", status: "flagged", caseId: "C-2026-0835" },
  { id: "f005", name: "vehicle_photo_rear.jpg", type: "image", size: "5.1 MB", uploadedAt: "2026-07-30 15:31", risk: "medium", score: 55, flaggedBy: "—", status: "pending", caseId: "C-2026-0835" },
  { id: "f006", name: "phone_screen_capture.jpg", type: "image", size: "1.8 MB", uploadedAt: "2026-07-30 09:14", risk: "high", score: 91, flaggedBy: "Analyst Chen", status: "reviewed", caseId: "C-2026-0831" },
  { id: "f007", name: "crowd_analysis.mp4", type: "video", size: "512 MB", uploadedAt: "2026-07-29 22:07", risk: "low", score: 8, flaggedBy: "—", status: "cleared", caseId: "C-2026-0828" },
  { id: "f008", name: "witness_recording.mp3", type: "audio", size: "9.4 MB", uploadedAt: "2026-07-29 16:45", risk: "medium", score: 48, flaggedBy: "—", status: "pending", caseId: "C-2026-0828" },
];

const TIMELINE_DATA = [
  { date: "Jul 25", high: 3, medium: 5, low: 9 },
  { date: "Jul 26", high: 7, medium: 8, low: 14 },
  { date: "Jul 27", high: 4, medium: 11, low: 20 },
  { date: "Jul 28", high: 9, medium: 6, low: 11 },
  { date: "Jul 29", high: 5, medium: 14, low: 18 },
  { date: "Jul 30", high: 12, medium: 9, low: 22 },
  { date: "Jul 31", high: 8, medium: 7, low: 15 },
];

const DIST_DATA = [
  { name: "High Risk", value: 48, color: "#F44336" },
  { name: "Medium Risk", value: 61, color: "#FFC107" },
  { name: "Low Risk", value: 109, color: "#4CAF50" },
];

const DETECTION_SIGNALS = [
  { label: "GAN artifact frequency", value: 87, status: "high" },
  { label: "Metadata inconsistency", value: 72, status: "high" },
  { label: "DCT coefficient anomaly", value: 64, status: "medium" },
  { label: "Noise pattern irregularity", value: 59, status: "medium" },
  { label: "Edge sharpness deviation", value: 41, status: "low" },
  { label: "Color histogram shift", value: 23, status: "low" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  high: "#F44336",
  medium: "#FFC107",
  low: "#4CAF50",
};

const RISK_BG: Record<RiskLevel, string> = {
  high: "rgba(244,67,54,0.12)",
  medium: "rgba(255,193,7,0.12)",
  low: "rgba(76,175,80,0.12)",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#8F92A1" },
  reviewed: { label: "Reviewed", color: "#4CAF50" },
  flagged: { label: "Flagged", color: "#F44336" },
  cleared: { label: "Cleared", color: "#4CAF50" },
};

const FILE_ICON = {
  image: Image,
  video: Video,
  audio: AudioLines,
  text: FileType2,
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wide"
      style={{ color: RISK_COLOR[level], background: RISK_BG[level] }}
    >
      <Circle size={5} fill={RISK_COLOR[level]} stroke="none" />
      {level}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "#F44336" : score >= 40 ? "#FFC107" : "#4CAF50";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  active,
  onNavigate,
  onLogout,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}) {
  const nav = [
    { id: "dashboard" as Screen, label: "Dashboard", Icon: LayoutDashboard },
    { id: "upload" as Screen, label: "Upload", Icon: Upload },
    { id: "reports" as Screen, label: "Reports", Icon: FileText },
    { id: "settings" as Screen, label: "Settings", Icon: Settings },
  ];

  return (
    <aside
      className="flex flex-col w-16 shrink-0 border-r"
      style={{
        background: "#0F1017",
        borderColor: "rgba(255,255,255,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center h-14 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-sm" style={{ background: "#FF7A00" }}>
          <ShieldAlert size={15} color="#0D0E12" strokeWidth={2.5} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-Drop files to begin analysis

JPEG · PNG · MP4 · MOV · MP3 · WAV · TXT · PDF — max 2center gap-1 pt-3 flex-1">
        {nav.map(({ id, label, Icon }) => {
          const isActive = active === id || (active === "file-detail" && id === "reports");
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className="relative w-10 h-10 flex items-center justify-center rounded transition-all group"
              style={{
                background: isActive ? "rgba(255,122,0,0.12)" : "transparent",
                color: isActive ? "#FF7A00" : "#8F92A1",
              }}
            >
              <Icon size={18} />
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: "#FF7A00" }}
                />
              )}
              <span
                className="absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="flex items-center justify-center pb-4">
        <button
          onClick={onLogout}
          title="Log out"
          className="w-10 h-10 flex items-center justify-center rounded transition-colors group relative"
          style={{ color: "#8F92A1" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F44336")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8F92A1")}
        >
          <LogOut size={17} />
          <span
            className="absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
            style={{ background: "#1A1C25", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
          >
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      className="flex items-center justify-between px-6 h-14 border-b shrink-0"
      style={{ borderColor: "rgba(255,255,255,0.06)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div>
        <h1
          className="text-base font-semibold leading-none"
          style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "#8F92A1" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 flex items-center justify-center rounded transition-colors relative"
          style={{ color: "#8F92A1" }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#F44336" }}
          />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
          >
            AC
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium" style={{ color: "#E4E5EA" }}>Analyst Chen</p>
            <p className="text-xs" style={{ color: "#8F92A1" }}>Senior Forensic</p>
          </div>
          <ChevronDown size={13} color="#8F92A1" />
        </div>
      </div>
    </header>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, onNavigate }: { onLogin: () => void; onNavigate: (s: Screen) => void }) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: "#0D0E12",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,122,0,0.06) 0%, transparent 70%)",
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded flex items-center justify-center mb-4"
            style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.3)" }}
          >
            <ShieldAlert size={22} color="#FF7A00" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}
          >
            4ensics
          </h1>
          <p className="text-xs mt-1 tracking-widest uppercase font-medium" style={{ color: "#FF7A00" }}>
            Forensic Media Intelligence
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-6 border"
          style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="text-sm font-medium mb-5" style={{ color: "#8F92A1" }}>
            Sign in to your agency account
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                Username / Badge ID
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst.chen@dept.gov"
                className="w-full rounded px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "#1A1C25",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E4E5EA",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,122,0,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1", fontFamily: "'DM Sans', sans-serif" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{
                    background: "#1A1C25",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E4E5EA",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,122,0,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#8F92A1" }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => onNavigate("forgot-password")} className="text-xs transition-colors" style={{ color: "#FF7A00" }}>
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded text-sm font-semibold transition-all"
              style={{
                background: loading ? "rgba(255,122,0,0.5)" : "#FF7A00",
                color: "#0D0E12",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {loading ? "Authenticating…" : "Sign In"}
            </button>
          </div>

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#8F92A1" }}>
              No account?{" "}
              <button onClick={() => onNavigate("request-access")} className="font-medium transition-colors" style={{ color: "#FF7A00" }}>
                Request Access
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#3A3D4A" }}>
          RESTRICTED — Authorized Personnel Only · v2.4.1
        </p>
      </div>
    </div>
  );
}

// ─── Screen: Dashboard ────────────────────────────────────────────────────────

function DashboardScreen({ onNavigate }: { onNavigate: (s: Screen, id?: string) => void }) {
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
                  <span className="w-2.5 h-0.5 rounded-full" style={{ background: c as string }} />
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

// ─── Screen: Upload ───────────────────────────────────────────────────────────

function UploadScreen() {
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState([
    { name: "scene_photo_03.jpg", size: "4.7 MB", progress: 100, risk: "high" as RiskLevel, done: true },
    { name: "voice_memo.m4a", size: "11.2 MB", progress: 68, risk: null as RiskLevel | null, done: false },
    { name: "evidence_doc.pdf", size: "2.1 MB", progress: 30, risk: null as RiskLevel | null, done: false },
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
                  const ext = u.name.split(".").pop()!.toUpperCase();
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

// ─── Screen: Reports ──────────────────────────────────────────────────────────

function ReportsScreen({ onNavigate }: { onNavigate: (s: Screen, id?: string) => void }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");

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
            {(["all", "high", "medium", "low"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-all"
                style={{
                  background: riskFilter === r ? (r === "all" ? "rgba(255,122,0,0.15)" : RISK_BG[r as RiskLevel] ?? "rgba(255,122,0,0.15)") : "#1A1C25",
                  color: riskFilter === r ? (r === "all" ? "#FF7A00" : RISK_COLOR[r as RiskLevel] ?? "#FF7A00") : "#8F92A1",
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

// ─── Screen: File Detail ──────────────────────────────────────────────────────

function FileDetailScreen({ fileId, onBack }: { fileId: string; onBack: () => void }) {
  const file = MOCK_FILES.find((f) => f.id === fileId) ?? MOCK_FILES[0];
  const Icon = FILE_ICON[file.type];
  const [activeTab, setActiveTab] = useState<"signals" | "metadata" | "history">("signals");

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
              {(["signals", "metadata", "history"] as const).map((t) => (
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
                            <RiskBadge level={s.status as RiskLevel} />
                            <span className="text-xs font-mono w-7 text-right" style={{ color: RISK_COLOR[s.status as RiskLevel] }}>{s.value}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${s.value}%`, background: RISK_COLOR[s.status as RiskLevel] }}
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

// ─── Screen: Settings ─────────────────────────────────────────────────────────

function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoFlag, setAutoFlag] = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [deepScan, setDeepScan] = useState(false);
  const [retention, setRetention] = useState("90");

  function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        onClick={() => onChange(!on)}
        className="w-10 h-5 rounded-full relative transition-colors"
        style={{ background: on ? "#FF7A00" : "#3A3D4A" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{ background: "#fff", left: on ? "calc(100% - 18px)" : "2px" }}
        />
      </button>
    );
  }

  const sections = [
    {
      title: "Analysis Engine",
      items: [
        {
          label: "Auto-flag high-risk files",
          desc: "Automatically flag files scoring above the risk threshold",
          control: <Toggle on={autoFlag} onChange={setAutoFlag} />,
        },
        {
          label: "Deep scan mode",
          desc: "Enable full GAN fingerprinting (increases processing time 3–5×)",
          control: <Toggle on={deepScan} onChange={setDeepScan} />,
        },
        {
          label: "Risk threshold",
          desc: `Files scoring ≥ ${threshold} are classified as high risk`,
          control: (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={95}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-28"
                style={{ accentColor: "#FF7A00" }}
              />
              <span className="text-xs font-mono w-8 text-right" style={{ color: "#FF7A00" }}>{threshold}</span>
            </div>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          label: "Email alerts",
          desc: "Send email when high-risk files are detected",
          control: <Toggle on={notifications} onChange={setNotifications} />,
        },
      ],
    },
    {
      title: "Data Retention",
      items: [
        {
          label: "File retention period",
          desc: "How long processed files are retained in the system",
          control: (
            <select
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
              className="px-3 py-1.5 rounded text-xs outline-none"
              style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="0">Indefinite</option>
            </select>
          ),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          label: "Analyst Chen",
          desc: "analyst.chen@forensics.gov · Senior Forensic Analyst",
          control: (
            <button
              className="px-3 py-1.5 rounded text-xs"
              style={{ background: "rgba(255,122,0,0.1)", color: "#FF7A00", border: "1px solid rgba(255,122,0,0.2)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Edit Profile
            </button>
          ),
        },
        {
          label: "Change password",
          desc: "Last changed 14 days ago",
          control: (
            <button
              className="px-3 py-1.5 rounded text-xs"
              style={{ background: "#1A1C25", color: "#8F92A1", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Update
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="Settings" subtitle="Platform configuration and account preferences" />
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-2xl">
          {sections.map((sec) => (
            <div key={sec.title} className="mb-6">
              <h2
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: "#8F92A1", fontFamily: "'Poppins', sans-serif" }}
              >
                {sec.title}
              </h2>
              <div
                className="rounded-lg border divide-y"
                style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)", borderTopColor: "rgba(255,255,255,0.07)", borderBottomColor: "rgba(255,255,255,0.07)" }}
              >
                {sec.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#E4E5EA", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8F92A1" }}>{item.desc}</p>
                    </div>
                    <div className="ml-4 shrink-0">{item.control}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
            className="rounded-lg border p-4 flex items-center gap-3"
            style={{ background: "rgba(244,67,54,0.05)", borderColor: "rgba(244,67,54,0.15)" }}
          >
            <AlertTriangle size={16} color="#F44336" />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#F44336", fontFamily: "'DM Sans', sans-serif" }}>Danger Zone</p>
              <p className="text-xs mt-0.5" style={{ color: "#8F92A1" }}>Permanently delete all processed files and analysis results</p>
            </div>
            <button
              className="px-3 py-1.5 rounded text-xs"
              style={{ background: "rgba(244,67,54,0.1)", color: "#F44336", border: "1px solid rgba(244,67,54,0.2)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Purge Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Forgot Password ─────────────────────────────────────────────────

function ForgotPasswordScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1000);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: "#0D0E12",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,122,0,0.06) 0%, transparent 70%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded flex items-center justify-center mb-4"
            style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.3)" }}
          >
            <ShieldAlert size={22} color="#FF7A00" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
            4ensics
          </h1>
          <p className="text-xs mt-1 tracking-widest uppercase font-medium" style={{ color: "#FF7A00" }}>
            Forensic Media Intelligence
          </p>
        </div>

        <div className="rounded-lg p-6 border" style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}>
          {!submitted ? (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                Reset your password
              </h2>
              <p className="text-xs mb-5" style={{ color: "#8F92A1" }}>
                Enter your registered agency email address and we'll send a secure reset link to your inbox.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>
                    Agency Email Address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst.chen@dept.gov"
                    className="w-full rounded px-3 py-2.5 text-sm outline-none transition-all"
                    style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,122,0,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !email}
                  className="w-full py-2.5 rounded text-sm font-semibold transition-all"
                  style={{
                    background: loading || !email ? "rgba(255,122,0,0.4)" : "#FF7A00",
                    color: "#0D0E12",
                    fontFamily: "'Poppins', sans-serif",
                    cursor: !email ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Sending reset link…" : "Send Reset Link"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.25)" }}
              >
                <CheckCircle2 size={26} color="#4CAF50" />
              </div>
              <h2 className="text-base font-semibold mb-2" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                Check your inbox
              </h2>
              <p className="text-xs mb-1" style={{ color: "#8F92A1" }}>
                A password reset link has been sent to
              </p>
              <p className="text-xs font-mono mb-5" style={{ color: "#FF7A00" }}>{email}</p>
              <p className="text-xs mb-5" style={{ color: "#8F92A1" }}>
                The link expires in <span style={{ color: "#E4E5EA" }}>30 minutes</span>. If you don't see it, check your spam folder or contact your system administrator.
              </p>
              <div
                className="w-full p-3 rounded text-xs text-left"
                style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.15)", color: "#8F92A1" }}
              >
                <span style={{ color: "#FFC107" }}>Note:</span> For security reasons, this link can only be used once and will expire after use.
              </div>
            </div>
          )}

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => onNavigate("login")}
              className="text-xs flex items-center justify-center gap-1 mx-auto transition-colors"
              style={{ color: "#8F92A1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF7A00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8F92A1")}
            >
              <ChevronRight size={12} className="rotate-180" /> Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#3A3D4A" }}>
          RESTRICTED — Authorized Personnel Only · v2.4.1
        </p>
      </div>
    </div>
  );
}

// ─── Screen: Request Access ───────────────────────────────────────────────────

function RequestAccessScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    badgeId: "",
    agency: "",
    department: "",
    title: "",
    justification: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid = form.firstName && form.lastName && form.email && form.badgeId && form.agency && form.justification;

  const handleSubmit = () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  const inputStyle = {
    background: "#1A1C25",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#E4E5EA",
    fontFamily: "'DM Sans', sans-serif",
  };
  const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "rgba(255,122,0,0.5)");
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)");

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center py-10"
      style={{
        background: "#0D0E12",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,122,0,0.06) 0%, transparent 70%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-full max-w-lg px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded flex items-center justify-center mb-4"
            style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.3)" }}
          >
            <ShieldAlert size={22} color="#FF7A00" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
            4ensics
          </h1>
          <p className="text-xs mt-1 tracking-widest uppercase font-medium" style={{ color: "#FF7A00" }}>
            Forensic Media Intelligence
          </p>
        </div>

        {!submitted ? (
          <div className="rounded-lg border" style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h2 className="text-base font-semibold mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                Request Platform Access
              </h2>
              <p className="text-xs" style={{ color: "#8F92A1" }}>
                Access is restricted to authorized law enforcement and forensic personnel. All requests are reviewed by a system administrator within 48 hours.
              </p>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>First Name <span style={{ color: "#F44336" }}>*</span></label>
                  <input value={form.firstName} onChange={set("firstName")} placeholder="Alexandra" className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Last Name <span style={{ color: "#F44336" }}>*</span></label>
                  <input value={form.lastName} onChange={set("lastName")} placeholder="Chen" className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              {/* Email + Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Agency Email <span style={{ color: "#F44336" }}>*</span></label>
                  <input value={form.email} onChange={set("email")} placeholder="a.chen@dept.gov" className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Badge / Employee ID <span style={{ color: "#F44336" }}>*</span></label>
                  <input value={form.badgeId} onChange={set("badgeId")} placeholder="FPD-20841" className="w-full rounded px-3 py-2.5 text-sm font-mono outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              {/* Agency + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Agency / Force <span style={{ color: "#F44336" }}>*</span></label>
                  <input value={form.agency} onChange={set("agency")} placeholder="Metro Police Department" className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Department / Unit</label>
                  <input value={form.department} onChange={set("department")} placeholder="Digital Forensics Unit" className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              {/* Job title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>Job Title / Role</label>
                <select value={form.title} onChange={set("title")} className="w-full rounded px-3 py-2.5 text-sm outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff}>
                  <option value="">Select role…</option>
                  <option>Forensic Analyst</option>
                  <option>Senior Forensic Analyst</option>
                  <option>Digital Evidence Officer</option>
                  <option>Detective</option>
                  <option>Investigating Officer</option>
                  <option>Supervisory Analyst</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F92A1" }}>
                  Access Justification <span style={{ color: "#F44336" }}>*</span>
                </label>
                <textarea
                  value={form.justification}
                  onChange={set("justification")}
                  rows={3}
                  placeholder="Briefly describe your operational need for access to the 4ensics platform…"
                  className="w-full rounded px-3 py-2.5 text-sm outline-none resize-none"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </div>

              {/* Notice */}
              <div
                className="flex gap-2.5 p-3 rounded text-xs"
                style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.15)", color: "#8F92A1" }}
              >
                <AlertTriangle size={13} color="#FFC107" className="shrink-0 mt-0.5" />
                <span>
                  Submitting a false or unauthorized request is a disciplinary offence. By submitting, you confirm that all information provided is accurate and that you are an authorized member of your agency.
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !isValid}
                className="w-full py-2.5 rounded text-sm font-semibold transition-all"
                style={{
                  background: loading || !isValid ? "rgba(255,122,0,0.4)" : "#FF7A00",
                  color: "#0D0E12",
                  fontFamily: "'Poppins', sans-serif",
                  cursor: !isValid ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Submitting request…" : "Submit Access Request"}
              </button>
            </div>

            <div className="px-6 py-4 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "#8F92A1" }}>
                Already have an account?{" "}
                <button onClick={() => onNavigate("login")} className="font-medium" style={{ color: "#FF7A00" }}>
                  Sign In
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* Confirmation screen */
          <div className="rounded-lg border p-8 flex flex-col items-center text-center" style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.25)" }}
            >
              <CheckCircle2 size={30} color="#4CAF50" />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
              Request Submitted
            </h2>
            <p className="text-sm mb-1" style={{ color: "#8F92A1" }}>Your access request has been received.</p>
            <p className="text-xs mb-6" style={{ color: "#8F92A1" }}>
              A system administrator will review your application and respond to{" "}
              <span className="font-mono" style={{ color: "#FF7A00" }}>{form.email}</span>{" "}
              within <span style={{ color: "#E4E5EA" }}>48 hours</span>.
            </p>

            <div className="w-full rounded-lg p-4 mb-6 text-left" style={{ background: "#0D0E12", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "#8F92A1", fontFamily: "'Poppins', sans-serif" }}>
                Request Summary
              </p>
              {[
                ["Name", `${form.firstName} ${form.lastName}`],
                ["Badge ID", form.badgeId],
                ["Agency", form.agency],
                ["Email", form.email],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-xs" style={{ color: "#8F92A1" }}>{k}</span>
                  <span className="text-xs font-mono" style={{ color: "#E4E5EA" }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5">
                <span className="text-xs" style={{ color: "#8F92A1" }}>Reference</span>
                <span className="text-xs font-mono" style={{ color: "#FF7A00" }}>REQ-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            <div
              className="w-full flex gap-2.5 p-3 rounded text-xs text-left mb-6"
              style={{ background: "rgba(255,122,0,0.07)", border: "1px solid rgba(255,122,0,0.15)", color: "#8F92A1" }}
            >
              <Info size={13} color="#FF7A00" className="shrink-0 mt-0.5" />
              <span>
                Do not submit duplicate requests. If you have not received a response within 48 hours, contact your local system administrator or IT helpdesk.
              </span>
            </div>

            <button
              onClick={() => onNavigate("login")}
              className="px-6 py-2.5 rounded text-sm font-semibold"
              style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "#3A3D4A" }}>
          RESTRICTED — Authorized Personnel Only · v2.4.1
        </p>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleNavigate = (s: Screen, id?: string) => {
    if (id) setSelectedFileId(id);
    setScreen(s);
  };

  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("dashboard")} onNavigate={setScreen} />;
  }
  if (screen === "forgot-password") {
    return <ForgotPasswordScreen onNavigate={setScreen} />;
  }
  if (screen === "request-access") {
    return <RequestAccessScreen onNavigate={setScreen} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0D0E12", fontFamily: "'DM Sans', sans-serif" }}
    >
      <Sidebar
        active={screen}
        onNavigate={handleNavigate}
        onLogout={() => setScreen("login")}
      />
      <main className="flex flex-col flex-1 overflow-hidden">
        {screen === "dashboard" && <DashboardScreen onNavigate={handleNavigate} />}
        {screen === "upload" && <UploadScreen />}
        {screen === "reports" && <ReportsScreen onNavigate={handleNavigate} />}
        {screen === "file-detail" && selectedFileId && (
          <FileDetailScreen
            fileId={selectedFileId}
            onBack={() => setScreen("reports")}
          />
        )}
        {screen === "settings" && <SettingsScreen />}
      </main>
    </div>
  );
}
