import {
  LayoutDashboard,
  Upload,
  FileText,
  Settings,
  LogOut,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { getRoleMeta } from "../utils/constants";

export default function Sidebar({ active, user, onNavigate, onLogout }) {
  const nav = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "upload", label: "Upload & Analyze", Icon: Upload },
    { id: "reports", label: "Case Reports", Icon: FileText },
    { id: "settings", label: "Settings & Users", Icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return "AN";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.full_name || "Analyst";
  const displayRole = user?.role || "Forensic Analyst";
  const roleMeta = getRoleMeta(displayRole);

  return (
    <aside
      className="flex flex-col w-16 shrink-0 border-r z-20"
      style={{
        background: "#0F1017",
        borderColor: "rgba(255,255,255,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Brand Logo */}
      <div
        className="flex items-center justify-center h-14 border-b shrink-0 cursor-pointer"
        onClick={() => onNavigate("dashboard")}
        title="4ensics Intelligence System"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded shadow-md"
          style={{ background: "linear-gradient(135deg, #FF7A00 0%, #E06000 100%)" }}
        >
          <ShieldAlert size={16} color="#0D0E12" strokeWidth={2.5} />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-1.5 pt-4 flex-1">
        {nav.map(({ id, label, Icon }) => {
          const isActive =
            active === id || (active === "file-detail" && id === "reports");
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className="relative w-10 h-10 flex items-center justify-center rounded transition-all group cursor-pointer"
              style={{
                background: isActive ? "rgba(255,122,0,0.14)" : "transparent",
                color: isActive ? "#FF7A00" : "#8F92A1",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r shadow-sm"
                  style={{ background: "#FF7A00" }}
                />
              )}
              {/* Flyout Label */}
              <span
                className="absolute left-full ml-3 px-2.5 py-1 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10"
                style={{
                  background: "#161822",
                  color: "#E4E5EA",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Sign Out */}
      <div className="flex flex-col items-center gap-2 pb-4">
        <div
          onClick={() => onNavigate("settings")}
          title={`${displayName} (${displayRole})`}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 shadow-sm"
          style={{
            background: roleMeta.bg,
            color: roleMeta.badgeColor,
            border: `1px solid ${roleMeta.border}`,
            fontFamily: "'Poppins', sans-serif"
          }}
        >
          {getInitials(displayName)}
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          className="w-9 h-9 flex items-center justify-center rounded transition-colors group relative cursor-pointer hover:bg-red-500/10 text-gray-500 hover:text-red-400"
        >
          <LogOut size={16} />
          <span
            className="absolute left-full ml-3 px-2.5 py-1 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10"
            style={{
              background: "#161822",
              color: "#F44336",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
