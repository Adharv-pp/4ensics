import { useState } from "react";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./screens/LoginScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import RequestAccessScreen from "./screens/RequestAccessScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UploadScreen from "./screens/UploadScreen";
import ReportsScreen from "./screens/ReportsScreen";
import FileDetailScreen from "./screens/FileDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("login");
  const [selectedFileId, setSelectedFileId] = useState(null);

  const handleNavigate = (s, id) => {
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
