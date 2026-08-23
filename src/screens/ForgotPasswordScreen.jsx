import { useState } from "react";
import { ShieldAlert, CheckCircle2, ChevronRight, AlertCircle, KeyRound, Copy, Check } from "lucide-react";
import { API_BASE_URL } from "../utils/constants";

export default function ForgotPasswordScreen({ onNavigate }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Code & New Password, 3: Success
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Step 1: Request Reset Code
  const handleRequestCode = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your registered agency email address.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate password reset request.");
      }

      if (data.reset_code) {
        setResetCode(data.reset_code);
      }
      setStep(2);
      setLoading(false);

    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to contact reset service.");
    }
  };

  // Step 2: Submit Reset Password
  const handleResetPassword = async () => {
    if (!resetCode.trim()) {
      setErrorMsg("Please provide the reset security code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reset_code: resetCode.trim(),
          new_password: newPassword
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed. Invalid or expired token.");
      }

      setStep(3);
      setLoading(false);

    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to reset password.");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(resetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded flex items-center justify-center mb-3 shadow-lg"
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

        <div className="rounded-lg p-6 border shadow-2xl" style={{ background: "#13151C", borderColor: "rgba(255,255,255,0.07)" }}>
          {errorMsg && (
            <div
              className="mb-4 p-2.5 rounded text-xs flex items-center gap-2"
              style={{ background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.3)", color: "#F44336" }}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                Reset your password
              </h2>
              <p className="text-xs mb-5" style={{ color: "#8F92A1" }}>
                Enter your registered agency email address to generate a secure authentication reset token.
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
                    onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
                  />
                </div>
                <button
                  onClick={handleRequestCode}
                  disabled={loading || !email}
                  className="w-full py-2.5 rounded text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: loading || !email ? "rgba(255,122,0,0.4)" : "#FF7A00",
                    color: "#0D0E12",
                    fontFamily: "'Poppins', sans-serif",
                    cursor: !email ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Generating Security Token…" : "Generate Reset Token"}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Enter Code & New Password */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={16} color="#FF7A00" />
                <h2 className="text-base font-semibold" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                  Enter New Password
                </h2>
              </div>
              
              {/* Security token box */}
              <div className="p-2.5 mb-4 rounded flex items-center justify-between" style={{ background: "#161822", border: "1px solid rgba(255,122,0,0.25)" }}>
                <div>
                  <div className="text-[10px] text-gray-400">Security Reset Code:</div>
                  <div className="font-mono text-sm font-bold text-amber-400">{resetCode}</div>
                </div>
                <button
                  onClick={copyCode}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} color="#4CAF50" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#8F92A1" }}>
                    Security Reset Code
                  </label>
                  <input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="RST-XXXXXX"
                    className="w-full font-mono rounded px-3 py-2 text-sm outline-none transition-all"
                    style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#8F92A1" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-all"
                    style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#8F92A1" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded px-3 py-2 text-sm outline-none transition-all"
                    style={{ background: "#1A1C25", border: "1px solid rgba(255,255,255,0.08)", color: "#E4E5EA" }}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  />
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword}
                  className="w-full py-2.5 mt-2 rounded text-sm font-semibold transition-all cursor-pointer"
                  style={{
                    background: loading || !newPassword ? "rgba(255,122,0,0.4)" : "#FF7A00",
                    color: "#0D0E12",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {loading ? "Updating Password…" : "Confirm Password Update"}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.25)" }}
              >
                <CheckCircle2 size={26} color="#4CAF50" />
              </div>
              <h2 className="text-base font-semibold mb-2" style={{ fontFamily: "'Poppins', sans-serif", color: "#E4E5EA" }}>
                Password Updated
              </h2>
              <p className="text-xs mb-4" style={{ color: "#8F92A1" }}>
                Your account password has been updated successfully. You may now sign in with your new credentials.
              </p>
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-2.5 rounded text-sm font-semibold transition-all cursor-pointer"
                style={{ background: "#FF7A00", color: "#0D0E12", fontFamily: "'Poppins', sans-serif" }}
              >
                Sign In Now
              </button>
            </div>
          )}

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => onNavigate("login")}
              className="text-xs flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
              style={{ color: "#8F92A1" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF7A00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8F92A1")}
            >
              <ChevronRight size={12} className="rotate-180" /> Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#4A4E5E" }}>
          RESTRICTED — Authorized Agency Personnel Only
        </p>
      </div>
    </div>
  );
}
