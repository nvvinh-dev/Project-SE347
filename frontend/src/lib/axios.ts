import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5015";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Token: Context (in-memory) là nguồn chính theo D20 ---
// AuthProvider gọi setAuthToken() mỗi khi login/logout/khôi phục phiên.
// Biến này cho phép axios (nằm ngoài cây React) đọc được token đồng bộ,
// mà KHÔNG cần đọc trực tiếp localStorage ở đây — sửa đúng lỗi #11.
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null, expiresAtUtc?: string): void {
  inMemoryToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (expiresAtUtc) localStorage.setItem(EXPIRY_STORAGE_KEY, expiresAtUtc);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
  }
}

const TOKEN_STORAGE_KEY = "nhatre_token";
const EXPIRY_STORAGE_KEY = "nhatre_token_expiry";

// Chỉ dùng lúc app khởi động để khôi phục phiên — sau đó dùng inMemoryToken.
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}
export function getStoredExpiresAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EXPIRY_STORAGE_KEY);
}

// Request interceptor — đọc từ biến in-memory, không đọc localStorage
apiClient.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Response interceptor — CHỈ auto-redirect khi 401 KHÔNG đến từ chính login
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes("/api/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      setAuthToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- Đọc lỗi thống nhất từ AxiosError — dùng ở MỌI nơi gọi apiClient ---
// Xử lý luôn cho mọi status (401 sai mật khẩu, 403, 429, 400 validate...),
// không cần if/else theo từng status code ở nơi gọi.
export class ApiError extends Error {
  errors: string[] | null;
  status: number | null;

  constructor(message: string, errors: string[] | null, status: number | null) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
    this.status = status;
  }
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    const message = data?.message ?? "Đã xảy ra lỗi, vui lòng thử lại.";
    return new ApiError(message, data?.errors ?? null, error.response?.status ?? null);
  }
  return new ApiError("Đã xảy ra lỗi không xác định.", null, null);
}