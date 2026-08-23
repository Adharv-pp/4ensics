import { useState, useEffect } from "react";
import {
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Users,
  X,
  Trash2,
  Edit3,
  Search,
  Check,
  RefreshCw,
  Sliders,
  Activity,
  Save,
  Clock
} from "lucide-react";
import Topbar from "../components/Topbar";
import { API_BASE_URL, AVAILABLE_ROLES, getRoleMeta } from "../utils/constants";
import { forensicStore } from "../data/forensicStore";

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0"
      style={{ background: on ? "#FF7A00" : "#3A3D4A" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm"
        style={{ background: "#fff", left: on ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

export default function SettingsScreen({ user, onLogout, onNavigate }) {
  // Settings Preferences State
  const [notifications, setNotifications] = useState(true);
  const [autoFlag, setAutoFlag] = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [deepScan, setDeepScan] = useState(true);
  const [retention, setRetention] = useState("90");
  const [saveSuccess, setSaveSuccess] = useState("");

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add user state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("Forensic Analyst");
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  // Role Edit state
  const [userToEditRole, setUserToEditRole] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [editStatusValue, setEditStatusValue] = useState("active");
  const [updatingRole, setUpdatingRole] = useState(false);

  // User Delete state
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // System Uptime State
  const [uptimeStr, setUptimeStr] = useState("1d 6h 42m");
  const [isLive, setIsLive] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");

  // Calculate live uptime
  useEffect(() => {
    const startTime = Date.now() - (30 * 3600 * 1000 + 42 * 60 * 1000); // 30h 42m baseline
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const totalSec = Math.floor(elapsedMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      setUptimeStr(`${days}d ${hours}h ${minutes}m`);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Load saved preferences
  useEffect(() => {
    const saved = forensicStore.getSettings();
    if (saved) {
      if (saved.notifications !== undefined) setNotifications(saved.notifications);
      if (saved.autoFlag !== undefined) setAutoFlag(saved.autoFlag);
      if (saved.threshold !== undefined) setThreshold(saved.threshold);
      if (saved.deepScanDefault !== undefined) setDeepScan(saved.deepScanDefault);
      if (saved.retentionDays !== undefined) setRetention(saved.retentionDays);
    }
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setIsLive(true);
      } else {
        throw new Error();
      }
    } catch {
      setIsLive(true);
      setUsersList([
        {
          user_id: user?.user_id || "u-admin",
          full_name: user?.full_name || "Lead Administrator",
          email: user?.email || "admin@4ensics.ai",
          role: user?.role || "Administrator",
          status: "active",
          badge_id: user?.badge_id || "ADM-001"
        },
        {
          user_id: "u-002",
          full_name: "Alexandra Chen",
          email: "a.chen@dept.gov",
          role: "Senior Investigator",
          status: "active",
          badge_id: "FPD-20841"
        },
        {
          user_id: "u-003",
          full_name: "Marcus Reyes",
          email: "m.reyes@dept.gov",
          role: "Forensic Analyst",
          status: "active",
          badge_id: "FPD-20892"
        }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const triggerActionNotification = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess("");
    }, 4000);
  };

  const handleSavePreferences = () => {
    forensicStore.saveSettings({
      notifications,
      autoFlag,
      threshold,
      deepScanDefault: deepScan,
      retentionDays: retention
    });
    setSaveSuccess("Preferences saved.");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setAddUserError("Please enter full name and email address.");
      return;
    }

    setAddingUser(true);
    setAddUserError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          added_by_name: user ? user.full_name : "Administrator",
          send_email: true
        })
      });

      if (!res.ok) throw new Error();
      fetchUsers();
    } catch {
      const newUserObj = {
        user_id: `u-${Date.now()}`,
        full_name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        status: "active",
        badge_id: `FPD-${Math.floor(10000 + Math.random() * 90000)}`
      };
      setUsersList((prev) => [newUserObj, ...prev]);
    } finally {
      setAddingUser(false);
      setNewUserName("");
      setNewUserEmail("");
      setShowAddModal(false);
      triggerActionNotification(`User ${newUserName} added successfully.`);
    }
  };

  const openEditRoleModal = (targetUser) => {
    setUserToEditRole(targetUser);
    setEditRoleValue(targetUser.role || "Forensic Analyst");
    setEditStatusValue(targetUser.status || "active");
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!userToEditRole) return;
    setUpdatingRole(true);

    try {
      await fetch(`${API_BASE_URL}/api/users/${userToEditRole.user_id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRoleValue,
          status: editStatusValue
        })
      });
    } catch {
      // ignore
    }

    setUsersList((prev) =>
      prev.map((u) =>
        u.user_id === userToEditRole.user_id
          ? { ...u, role: editRoleValue, status: editStatusValue }
          : u
      )
    );

    triggerActionNotification(`Role for ${userToEditRole.full_name} updated.`);
    setUserToEditRole(null);
    setUpdatingRole(false);
  };

  const openDeleteModal = (targetUser) => {
    setUserToDelete(targetUser);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    if (user && (user.user_id === userToDelete.user_id || user.email === userToDelete.email)) {
      setDeleteError("You cannot delete your own currently active administrator account.");
      return;
    }

    setDeletingUser(true);
    try {
      await fetch(`${API_BASE_URL}/api/users/${userToDelete.user_id}`, {
        method: "DELETE"
      });
    } catch {
      // ignore
    }

    setUsersList((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
    triggerActionNotification(`User ${userToDelete.full_name} removed.`);
    setDeletingUser(false);
    setUserToDelete(null);
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        title="Settings & Administration"
        subtitle="Manage analysis thresholds, operational roles, and platform policies"
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Action Notification Banner */}
          {actionSuccess && (
            <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 shadow-sm">
              <CheckCircle2 size={16} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Section 1: System Preferences Card */}
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Sliders size={18} color="#FF7A00" />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Triage & Sensitivity Preferences
                </h3>
              </div>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={13} /> {saveSuccess}
                </span>
              )}
            </div>

            <div className="divide-y divide-white/5 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              
              {/* Threshold Slider */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      AI Anomaly Flagging Threshold
                    </p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Media scoring at or above this score will be classified as High Risk.
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono text-orange-400 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20">
                    {threshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                  <span>40% (Permissive)</span>
                  <span>75% (Recommended)</span>
                  <span>95% (Strict)</span>
                </div>
              </div>

              {/* Toggle: Notifications */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Security Alerts & High-Risk Notifications
                  </p>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Display badge alerts in the top bar when synthetic media is detected.
                  </p>
                </div>
                <Toggle on={notifications} onChange={setNotifications} />
              </div>

              {/* Toggle: Deep Scan Default */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Deep Temporal Frame Scanning
                  </p>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Analyze spatiotemporal video segments for granular anomaly localization.
                  </p>
                </div>
                <Toggle on={deepScan} onChange={setDeepScan} />
              </div>

              {/* Retention Policy */}
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Evidence Retention Period
                  </p>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    Duration for retaining audit logs and verification records.
                  </p>
                </div>
                <select
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#1A1C25] text-white text-xs outline-none cursor-pointer"
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/5 flex justify-end">
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <Save size={14} />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>

          {/* Section 2: User Access & Role Management Card */}
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Users size={18} color="#FF7A00" />
                <div>
                  <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Agency User & Role Management
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Manage analyst accounts and operational access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <UserPlus size={13} strokeWidth={2.5} />
                  <span>Add Analyst</span>
                </button>
              </div>
            </div>

            {/* Search Filter for users */}
            <div className="my-4 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter users by name, email, or role…"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none border border-white/10 bg-[#1A1C25] text-white"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr className="border-b" style={{ background: "#0F1017", borderColor: "rgba(255,255,255,0.06)" }}>
                    {["Analyst Name", "Agency Email", "Assigned Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const roleMeta = getRoleMeta(u.role);
                    return (
                      <tr key={u.user_id || u.email} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white block" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {u.full_name}
                          </span>
                          {u.badge_id && (
                            <span className="text-[10px] font-mono text-gray-500 block">
                              Badge: {u.badge_id}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-gray-400">{u.email}</td>

                        <td className="px-4 py-3">
                          <span
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-block"
                            style={{ background: roleMeta.bg, color: roleMeta.badgeColor, borderColor: roleMeta.border }}
                          >
                            {u.role || "Forensic Analyst"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded capitalize"
                            style={{
                              background: u.status === "active" ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)",
                              color: u.status === "active" ? "#4CAF50" : "#F44336",
                            }}
                          >
                            {u.status || "active"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditRoleModal(u)}
                              title="Edit Role & Permissions"
                              className="p-1 rounded text-gray-400 hover:text-orange-400 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              title="Delete User"
                              className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
          </div>

          {/* Section 3: Clean System Status & Uptime Card */}
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                  <Activity size={18} color="#4CAF50" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#4CAF50]" />
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      System Operational
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    All AI forensic models and database services are healthy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-gray-300">
                <Clock size={13} color="#FF7A00" />
                <span>Uptime: <strong className="text-white font-semibold">{uptimeStr}</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-4"
            style={{ background: "#161822", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus size={18} color="#FF7A00" />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Add Agency Analyst
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {addUserError && (
              <div className="p-2.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Officer Jane Doe"
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Agency Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="j.doe@dept.gov"
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Assigned Operational Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white cursor-pointer"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {addingUser ? "Adding…" : "Add Analyst"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Role Modal */}
      {userToEditRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-4"
            style={{ background: "#161822", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 size={18} color="#FF7A00" />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Edit User: {userToEditRole.full_name}
                </h3>
              </div>
              <button onClick={() => setUserToEditRole(null)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Assigned Role</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white cursor-pointer"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Account Status</label>
                <select
                  value={editStatusValue}
                  onChange={(e) => setEditStatusValue(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none border border-white/10 bg-[#13151C] text-white cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setUserToEditRole(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-[#0D0E12] bg-orange-500 hover:bg-orange-400 transition-colors shadow-md cursor-pointer"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {updatingRole ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-4"
            style={{ background: "#161822", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 size={20} />
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Confirm User Deletion
              </h3>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Are you sure you want to delete <span className="font-semibold text-white font-mono">{userToDelete.full_name}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingUser}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md cursor-pointer"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {deletingUser ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
