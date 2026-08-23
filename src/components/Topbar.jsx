import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronDown,
  Shield,
  Settings,
  LogOut,
  AlertTriangle,
  FileText,
  User,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { getRoleMeta } from "../utils/constants";
import { forensicStore } from "../data/forensicStore";

function formatRelativeTime(ts) {
  if (!ts) return "Just now";
  const now = Date.now();
  const timeMs = typeof ts === "number" ? ts : new Date(ts).getTime();
  if (isNaN(timeMs)) return ts;
  
  const diffSec = Math.floor((now - timeMs) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function Topbar({ title, subtitle, user, onNavigate, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [reports, setReports] = useState([]);
  
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const unsub = forensicStore.subscribe((data) => {
      setReports(data || []);
    });
    return unsub;
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flaggedReports = reports.filter((r) => r.risk === "high" || r.status === "flagged");
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.full_name || "Forensic Analyst";
  const displayRole = user?.role || "Forensic Analyst";
  const roleMeta = getRoleMeta(displayRole);

  return (
    <header
      className="flex items-center justify-between px-6 h-14 border-b shrink-0 relative z-30"
      style={{
        background: "#0F1017",
        borderColor: "rgba(255,255,255,0.06)",
        fontFamily: "'DM Sans', sans-serif",
      }}
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
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            title="Notifications & Alerts"
            className="w-8 h-8 flex items-center justify-center rounded transition-colors relative cursor-pointer hover:bg-white/5"
            style={{ color: showNotifications ? "#FF7A00" : "#8F92A1" }}
          >
            <Bell size={16} />
            {flaggedReports.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#F44336", boxShadow: "0 0 6px #F44336" }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-lg border shadow-2xl p-3"
              style={{
                background: "#161822",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} color="#FF7A00" />
                  <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Security Alerts ({flaggedReports.length})
                  </span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded text-amber-400 bg-amber-400/10">
                  {pendingCount} Pending Triage
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2" style={{ scrollbarWidth: "none" }}>
                {flaggedReports.length === 0 ? (
                  <p className="text-xs text-center py-4 text-gray-400">No active high-risk alerts.</p>
                ) : (
                  flaggedReports.slice(0, 5).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (onNavigate) onNavigate("file-detail", f.id);
                      }}
                      className="p-2 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-semibold text-gray-200 truncate max-w-[170px]">
                          {f.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                          {f.score}% RISK
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{f.summary}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500 font-mono">
                        <span>Case: {f.caseId}</span>
                        <span>{formatRelativeTime(f.timestamp || f.uploadedAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {flaggedReports.length > 5 && (
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate("reports");
                  }}
                  className="w-full mt-2 pt-2 border-t border-white/5 text-center text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  View all in Reports Screen →
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-3 border-l cursor-pointer hover:opacity-90 transition-opacity"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
              style={{
                background: "rgba(255,122,0,0.18)",
                color: "#FF7A00",
                border: "1px solid rgba(255,122,0,0.4)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {getInitials(displayName)}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: "#E4E5EA", fontFamily: "'Poppins', sans-serif" }}>
                {displayName}
              </p>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: roleMeta.badgeColor }}>
                {displayRole}
              </p>
            </div>
            <ChevronDown size={13} color="#8F92A1" className={showUserMenu ? "rotate-180 transition-transform" : "transition-transform"} />
          </div>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-60 rounded-lg border shadow-2xl p-2.5"
              style={{
                background: "#161822",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-2 py-2 mb-1.5 border-b border-white/5">
                <p className="text-xs font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email || "analyst@4ensics.ai"}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                    style={{ background: roleMeta.bg, color: roleMeta.badgeColor, borderColor: roleMeta.border }}
                  >
                    {displayRole}
                  </span>
                  {user?.badge_id && (
                    <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                      ID: {user.badge_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onNavigate) onNavigate("settings");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors text-left cursor-pointer"
                >
                  <Settings size={14} color="#8F92A1" />
                  <span>Platform Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (onNavigate) onNavigate("reports");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors text-left cursor-pointer"
                >
                  <FileText size={14} color="#8F92A1" />
                  <span>Case Records</span>
                </button>

                <div className="pt-1 border-t border-white/5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors text-left cursor-pointer font-medium"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
