import { useState } from "react";
import { ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

export default function ForgotPasswordScreen({ onNavigate }) {
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
