"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { toApiError } from "@/lib/axios";

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, token, isLoading } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  // Tự động chuyển hướng về trang chủ "/" nếu người dùng đã có phiên hợp lệ
  useEffect(() => {
    if (!isLoading && token && user) {
      router.replace("/");
    }
  }, [isLoading, token, user, router]);

  async function onSubmit(data: LoginFormInputs) {
    setServerError(null);
    setServerFieldErrors([]);

    try {
      await login(data.email, data.password);
      // Đăng nhập thành công chỉ gọi router.replace("/") theo quy ước §4.0.1
      router.replace("/");
    } catch (err) {
      const apiErr = toApiError(err);

      // Bắt mã lỗi HTTP 429 khi vượt ngưỡng giới hạn tần suất đăng nhập (D54: 5 lần/phút)
      if (apiErr.status === 429) {
        setServerError(
          apiErr.message ||
            "Bạn đã thử đăng nhập quá nhiều lần (tối đa 5 lần/phút). Vui lòng thử lại sau 1 phút."
        );
        return;
      }

      if (apiErr.errors && apiErr.errors.length > 0) {
        setServerFieldErrors(apiErr.errors);
      }

      setServerError(apiErr.message ?? "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  }

  // Tránh flash giao diện đăng nhập nếu đang khôi phục phiên hoặc đã đăng nhập
  if (isLoading || (token && user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-muted">Đang kiểm tra phiên làm việc...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hệ thống Quản lý Nhà trẻ
          </h1>
          <p className="mt-1 text-sm text-muted">
            Đăng nhập để tiếp tục làm việc
          </p>
        </div>

        {serverError && (
          <div className="mb-5 rounded-lg border border-danger-border bg-danger-bg p-3.5 text-sm text-danger">
            <p className="font-medium">{serverError}</p>
            {serverFieldErrors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                {serverFieldErrors.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-foreground bg-card shadow-sm transition-colors focus:outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.email ? "border-danger" : "border-border"
              }`}
              placeholder="ten@truong.edu.vn"
              {...register("email", {
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không đúng định dạng",
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-foreground bg-card shadow-sm transition-colors focus:outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.password ? "border-danger" : "border-border"
              }`}
              placeholder="••••••••"
              {...register("password", {
                required: "Vui lòng nhập mật khẩu",
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-brand hover:bg-brand-hover active:bg-brand-active py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
