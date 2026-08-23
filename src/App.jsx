import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./screens/LoginScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import RequestAccessScreen from "./screens/RequestAccessScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UploadScreen from "./screens/UploadScreen";
import ReportsScreen from "./screens/ReportsScreen";
import FileDetailScreen from "./screens/FileDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { API_BASE_URL } from "./utils/constants";

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);

  // Restore session from localStorage on startup
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("4ensics_user");
      const savedToken = localStorage.getItem("4ensics_token");
      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
        setScreen("dashboard");
      }
    } catch (e) {
      console.warn("Failed to restore session:", e);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    try {
      const session_id = localStorage.getItem("4ensics_token");
      if (session_id) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id })
        });
      }
    } catch (e) {
      console.warn("Logout API warning:", e);
    } finally {
      localStorage.removeItem("4ensics_user");
      localStorage.removeItem("4ensics_token");
      setCurrentUser(null);
      setScreen("login");
    }
  };

  const handleNavigate = (s, id) => {
    let targetScreen = s;
    if (s === "fileDetail" || s === "file-detail" || s === "reportDetail") {
      targetScreen = "file-detail";
    }
    if (id) {
      const fileIdStr = typeof id === "object" && id !== null ? (id.id || id.reportId || id.fileId) : id;
      setSelectedFileId(fileIdStr);
    }
    setScreen(targetScreen);
  };

  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin} onNavigate={setScreen} />;
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
        user={currentUser}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="flex flex-col flex-1 overflow-hidden">
        {screen === "dashboard" && (
          <DashboardScreen
            onNavigate={handleNavigate}
            user={currentUser}
            onLogout={handleLogout}
          />
        )}
        {screen === "upload" && (
          <UploadScreen
            user={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {screen === "reports" && (
          <ReportsScreen
            onNavigate={handleNavigate}
            user={currentUser}
            onLogout={handleLogout}
          />
        )}
        {(screen === "file-detail" || screen === "fileDetail") && (
          <FileDetailScreen
            fileId={selectedFileId || "f001"}
            onBack={() => setScreen("reports")}
            user={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}
        {screen === "settings" && (
          <SettingsScreen
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
