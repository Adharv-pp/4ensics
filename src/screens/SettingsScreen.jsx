import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Topbar from "../components/Topbar";

function Toggle({ on, onChange }) {
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

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoFlag, setAutoFlag] = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [deepScan, setDeepScan] = useState(false);
  const [retention, setRetention] = useState("90");

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
