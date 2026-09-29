"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  apiClient,
  getStoredToken,
  getStoredExpiresAt,
  setAuthToken,
  toApiError,
  ApiError,
} from "@/lib/axios";
import type { ApiResponse, LoginResponseData, Role } from "@/types/auth";

export interface AuthUser {
  userId: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // D48: Thu hoi token qua POST /api/auth/logout truoc khi xoa Context va localStorage
  const logout = useCallback(async () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    try {
      await apiClient.post("/api/auth/logout");
    } catch (err) {
      // Bat loi qua toApiError; neu server chua co endpoint hoac loi mang thi van don dep an toan
      const apiErr = toApiError(err);
      console.warn("Logout API warning:", apiErr.message);
    } finally {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  }, []);

  // Dat timer tu logout dung luc token het han
  const scheduleAutoLogout = useCallback(
    (expiresAtUtc: string) => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      const msUntilExpiry = new Date(expiresAtUtc).getTime() - Date.now();
      if (msUntilExpiry <= 0) {
        void logout();
        return;
      }
      logoutTimerRef.current = setTimeout(() => {
        void logout();
      }, msUntilExpiry);
    },
    [logout]
  );

  // Khoi phuc phien tu token da luu khi tai lai trang.
  // Doc ca fullName tu GET /api/auth/me de header khong bi mat ho ten khi reload.
  useEffect(() => {
    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) return;

      setAuthToken(storedToken);
      try {
        const res = await apiClient.get<
          ApiResponse<{ userId: string; fullName?: string; role: Role }>
        >("/api/auth/me");

        if (!res.data.success || !res.data.data) {
          setAuthToken(null);
          return;
        }

        setToken(storedToken);
        setUser({
          userId: res.data.data.userId,
          fullName: res.data.data.fullName ?? "",
          role: res.data.data.role,
        });

        const storedExpiry = getStoredExpiresAt();
        if (storedExpiry) {
          scheduleAutoLogout(storedExpiry);
        } else {
          void logout();
        }
      } catch {
        setAuthToken(null);
      }
    }

    restoreSession().finally(() => setIsLoading(false));

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [logout, scheduleAutoLogout]);

  async function login(email: string, password: string) {
    try {
      const res = await apiClient.post<ApiResponse<LoginResponseData>>(
        "/api/auth/login",
        { email, password }
      );

      const loginData = res.data.data;
      if (!loginData) {
        throw new ApiError(
          res.data.message ?? "Dang nhap that bai.",
          res.data.errors,
          null
        );
      }

      const { token: newToken, userId, fullName, role, expiresAtUtc } = loginData;

      setAuthToken(newToken, expiresAtUtc);
      setToken(newToken);
      setUser({ userId, fullName, role });
      scheduleAutoLogout(expiresAtUtc);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw toApiError(err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phai duoc goi ben trong AuthProvider");
  }
  return context;
}
