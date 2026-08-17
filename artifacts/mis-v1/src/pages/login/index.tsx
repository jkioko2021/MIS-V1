import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginStep = "credentials" | "otp" | "change_password";

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd().padEnd(Math.min(i + (digit ? 1 : 0), 6), " ").slice(0, 6);
    onChange(arr.join("").replace(/ /g, "").padEnd(Math.max(value.length, i + (digit ? 1 : 0)), "").slice(0, 6));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const arr = value.split("");
      if (arr[i]) { arr[i] = ""; onChange(arr.join("")); }
      else if (i > 0) { arr[i - 1] = ""; onChange(arr.join("")); inputs.current[i - 1]?.focus(); }
    } else if (e.key === "ArrowLeft" && i > 0) { inputs.current[i - 1]?.focus(); }
    else if (e.key === "ArrowRight" && i < 5) { inputs.current[i + 1]?.focus(); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all",
            "bg-white text-slate-800",
            value[i]
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50",
          )}
        />
      ))}
    </div>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i < passed ? colors[passed] : "bg-slate-200")} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={cn("flex items-center gap-1.5 text-xs transition-colors", c.ok ? "text-green-600" : "text-slate-400")}>
            <CheckCircle className={cn("w-3 h-3", c.ok ? "text-green-500" : "text-slate-300")} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, verifyOtp, changePassword } = useAuth();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Credentials step
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // OTP step
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [passwordExpiredAfterOtp, setPasswordExpiredAfterOtp] = useState(false);

  // Change password step
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username, password);
      setTempToken(result.tempToken);
      setDevOtp(result.devOtp);
      setPasswordExpiredAfterOtp(result.passwordExpired);
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await verifyOtp(tempToken, otp);
      if (result.passwordExpired) {
        setStep("change_password");
      }
      // If not expired, AuthProvider sets user → App will redirect automatically
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      await changePassword(password, newPassword);
      // AuthProvider will pick up the user from the cookie; force a refresh
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">

      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">AAR Insurance</div>
                <div className="text-blue-200 text-xs">Management Information System</div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-2">
              {(["credentials", "otp", "change_password"] as LoginStep[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step === s ? "bg-white text-blue-800"
                      : (["credentials", "otp", "change_password"].indexOf(step) > i)
                        ? "bg-blue-400 text-white"
                        : "bg-blue-800/60 text-blue-300"
                  )}>{i + 1}</div>
                  {i < 2 && <div className={cn("w-6 h-px transition-all", ["credentials", "otp", "change_password"].indexOf(step) > i ? "bg-blue-400" : "bg-blue-800/60")} />}
                </div>
              ))}
              <span className="ml-1 text-blue-200 text-xs">
                {step === "credentials" ? "Sign in" : step === "otp" ? "Verify" : "New password"}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6">

            {/* ── Credentials ── */}
            {step === "credentials" && (
              <form onSubmit={handleCredentials} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                  <Input
                    id="username"
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="your.username"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-blue-700 hover:bg-blue-800 font-medium" disabled={loading}>
                  {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Signing in…</> : "Sign In"}
                </Button>
              </form>
            )}

            {/* ── OTP ── */}
            {step === "otp" && (
              <form onSubmit={handleOtp} className="space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-700">Enter verification code</p>
                  <p className="text-xs text-slate-500">A 6-digit code was sent to your registered email</p>
                </div>

                {devOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                    <div className="text-xs text-amber-600 font-medium mb-1">Dev mode — OTP</div>
                    <div className="text-2xl font-mono font-bold tracking-widest text-amber-700">{devOtp}</div>
                  </div>
                )}

                <OtpInput value={otp} onChange={setOtp} />

                {error && (
                  <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-blue-700 hover:bg-blue-800 font-medium" disabled={loading || otp.length !== 6}>
                  {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : "Verify Code"}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                  className="w-full text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Back to login
                </button>
              </form>
            )}

            {/* ── Change Password ── */}
            {step === "change_password" && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {passwordExpiredAfterOtp
                    ? "Your password has expired. Please set a new password to continue."
                    : "Please set a new password for your account."}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      autoFocus
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && <PasswordStrength password={newPassword} />}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={cn("h-11 pr-10", confirmPassword && confirmPassword !== newPassword && "border-red-400")}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-blue-700 hover:bg-blue-800 font-medium"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}>
                  {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Set New Password"}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-5 text-center">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} AAR Insurance Kenya Ltd · MIS v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
