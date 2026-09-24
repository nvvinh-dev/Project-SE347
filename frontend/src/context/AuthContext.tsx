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

interface AuthUser {
  userId: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  // Đặt timer tự logout đúng lúc token hết hạn
  const scheduleAutoLogout = useCallback(
    (expiresAtUtc: string) => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      const msUntilExpiry = new Date(expiresAtUtc).getTime() - Date.now();
      if (msUntilExpiry <= 0) {
        logout();
        return;
      }
      logoutTimerRef.current = setTimeout(logout, msUntilExpiry);
    },
    [logout]
  );

  // Khôi phục phiên từ token đã lưu khi tải lại trang. isLoading chỉ tắt sau khi
  // việc khôi phục kết thúc, kể cả khi máy không có token nào.
  useEffect(() => {
    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) return;

      setAuthToken(storedToken);
      try {
        const res = await apiClient.get<ApiResponse<{ userId: string; role: Role }>>(
          "/api/auth/me"
        );
        if (!res.data.success || !res.data.data) {
          setAuthToken(null);
          return;
        }

        setToken(storedToken);
        setUser({
          userId: res.data.data.userId,
          fullName: "",
          role: res.data.data.role,
        });

        // Đặt lại timer từ expiresAtUtc đã lưu. Không có hạn lưu kèm token thì
        // coi như hết hạn ngay để buộc đăng nhập lại — an toàn hơn là để token
        // sống vô thời hạn.
        const storedExpiry = getStoredExpiresAt();
        if (storedExpiry) {
          scheduleAutoLogout(storedExpiry);
        } else {
          logout();
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
        // Backend trả 200 nhưng data null — tình huống hiếm nhưng
        // không nên vỡ bằng TypeError, ném ApiError có message tử tế.
        throw new ApiError(
          res.data.message ?? "Đăng nhập thất bại.",
          res.data.errors,
          null
        );
      }

      const { token: newToken, userId, fullName, role, expiresAtUtc } = loginData;

      setAuthToken(newToken, expiresAtUtc); // lưu kèm hạn dùng
      setToken(newToken);
      setUser({ userId, fullName, role });
      scheduleAutoLogout(expiresAtUtc);
    } catch (err) {
      if (err instanceof ApiError) throw err; // đã đúng dạng, không cần bọc lại
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
    throw new Error("useAuth phải được gọi bên trong AuthProvider");
  }
  return context;
}