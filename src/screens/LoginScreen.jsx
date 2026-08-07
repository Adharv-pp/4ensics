import { useState } from "react";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function LoginScreen({ onLogin, onNavigate }) {
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
