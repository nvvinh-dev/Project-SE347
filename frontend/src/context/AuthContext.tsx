"use client";

import {
  createContext,
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

  // Đặt timer tự logout đúng lúc token hết hạn
  function scheduleAutoLogout(expiresAtUtc: string) {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    const msUntilExpiry = new Date(expiresAtUtc).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }
    logoutTimerRef.current = setTimeout(logout, msUntilExpiry);
  }

    useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setAuthToken(storedToken);

    apiClient
      .get<ApiResponse<{ userId: string; role: Role }>>("/api/auth/me")
      .then((res) => {
        if (res.data.success && res.data.data) {
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
        } else {
          setAuthToken(null);
        }
      })
      .catch(() => setAuthToken(null))
      .finally(() => setIsLoading(false));

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

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

      setAuthToken(newToken, expiresAtUtc); // giờ lưu kèm cả hạn dùng
      setToken(newToken);
      setUser({ userId, fullName, role });
      scheduleAutoLogout(expiresAtUtc);
    } catch (err) {
      if (err instanceof ApiError) throw err; // đã đúng dạng, không cần bọc lại
      throw toApiError(err);
    }
  }

  function logout() {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setToken(null);
    setUser(null);
    setAuthToken(null);
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