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
  verifyOtp: (tempToken: string, otp: string) => Promise<VerifyResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface LoginResult {
  step: "otp";
  tempToken: string;
  passwordExpired: boolean;
  devOtp?: string;
}

export interface VerifyResult {
  user: AuthUser;
  passwordExpired: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    passwordExpired: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setState({ user: data.user, loading: false, passwordExpired: false });
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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Login failed");
    return data as LoginResult;
  }, []);

  const verifyOtp = useCallback(async (tempToken: string, otp: string): Promise<VerifyResult> => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tempToken, otp }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "OTP verification failed");
    setState(s => ({ ...s, user: data.user, passwordExpired: data.passwordExpired }));
    return data as VerifyResult;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch("/api/auth/change-password", {
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
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
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
