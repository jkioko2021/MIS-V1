import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  profileId: number;
  profileName?: string;
  department?: string | null;
  menuAccess?: string[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  passwordExpired: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<LoginResult>;
  verifyOtp: (tempToken: string, otp: string) => Promise<AuthenticatedResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface AuthenticatedResult {
  step: "authenticated";
  user: AuthUser;
  passwordExpired: boolean;
}
export type LoginResult = AuthenticatedResult | {
  step: "otp"; tempToken: string; maskedEmail: string; expiresInSeconds: number;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    passwordExpired: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${AUTH_BASE}/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setState({ user: data.user, loading: false, passwordExpired: Boolean(data.passwordExpired) });
      } else {
        setState({ user: null, loading: false, passwordExpired: false });
      }
    } catch {
      setState({ user: null, loading: false, passwordExpired: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Login failed");
    if (data.step !== "otp") setState(s => ({ ...s, user: data.user, passwordExpired: data.passwordExpired }));
    return data as LoginResult;
  }, []);

  const verifyOtp = useCallback(async (tempToken: string, otp: string): Promise<AuthenticatedResult> => {
    const res = await fetch(`${AUTH_BASE}/verify-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ tempToken, otp }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Verification failed");
    setState(s => ({ ...s, user: data.user, passwordExpired: data.passwordExpired }));
    return data;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${AUTH_BASE}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Password change failed");
    setState(s => ({ ...s, passwordExpired: false }));
  }, []);

  const logout = useCallback(async () => {
    const res = await fetch(`${AUTH_BASE}/logout`, { method: "POST", credentials: "include" });
    // A revoked session is already signed out; outages must not look successful.
    if (!res.ok && res.status !== 401) throw new Error("Unable to sign out. Please try again.");
    setState({ user: null, loading: false, passwordExpired: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, verifyOtp, changePassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
