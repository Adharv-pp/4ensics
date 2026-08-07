import { useState } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export default function RequestAccessScreen({ onNavigate }) {
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
  const focusOn = (e) => (e.currentTarget.style.borderColor = "rgba(255,122,0,0.5)");
  const focusOff = (e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)");

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
