import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginStep = "credentials" | "otp" | "change_password";

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
  const { login, verifyOtp, changePassword, passwordExpired } = useAuth();

  const [step, setStep] = useState<LoginStep>(passwordExpired ? "change_password" : "credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Credentials step
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  // Change password step
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.step === "otp") {
        setTempToken(result.tempToken); setMaskedEmail(result.maskedEmail);
        setOtp(""); setStep("otp");
      } else if (result.passwordExpired) setStep("change_password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await verifyOtp(tempToken, otp);
      if (result.passwordExpired) setStep("change_password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally { setLoading(false); }
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

            <div className="mt-2 text-blue-200 text-sm">
              {step === "credentials" ? "Sign in" : step === "otp" ? "Email verification" : "New password"}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6">

            {step === "otp" && (
              <form onSubmit={handleOtp} className="space-y-5">
                <p className="text-sm text-slate-600">
                  A verification code was sent to {maskedEmail}. It expires in 5 minutes.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="login-otp">Verification Code</Label>
                  <Input id="login-otp" autoFocus autoComplete="one-time-code" inputMode="numeric"
                    maxLength={6} pattern="[0-9]{6}" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 text-center text-xl tracking-widest" required />
                </div>
                {error && <div role="alert" className="text-sm text-red-700">{error}</div>}
                <Button type="submit" className="w-full h-11 bg-blue-700 hover:bg-blue-800"
                  disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying…" : "Verify Code"}
                </Button>
                <button type="button" className="w-full text-sm text-blue-700 underline"
                  onClick={() => { setStep("credentials"); setTempToken(""); setOtp(""); setError(""); }}>
                  Back to sign in / request a new code
                </button>
                <p className="text-xs text-slate-500">To request another code, sign in again after one minute.</p>
              </form>
            )}
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

            {/* ── Change Password ── */}
            {step === "change_password" && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  Your password has expired or must be reset. Please set a new password to continue.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium text-slate-700">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPw ? "text" : "password"}
                      autoComplete="new-password"
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
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPw ? "text" : "password"}
                      autoComplete="new-password"
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
