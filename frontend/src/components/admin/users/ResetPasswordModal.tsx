"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useResetPassword } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { UserResponse } from "@/types/user";

interface ResetPasswordFormData {
  newPassword: string;
}

interface ResetPasswordModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ResetPasswordModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      newPassword: "",
    },
  });

  const handleClose = () => {
    if (resetPassword.isPending) return;
    setServerError(null);
    setShowPassword(false);
    reset({ newPassword: "" });
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !resetPassword.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, user, onClose, resetPassword.isPending]);

  if (!isOpen || !user) return null;

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);

    try {
      // KHÔNG TRIM mật khẩu theo D20 & UserRuleExtensions
      await resetPassword.mutateAsync({
        id: user.id,
        data: { newPassword: data.newPassword },
      });

      setServerError(null);
      setShowPassword(false);
      reset({ newPassword: "" });
      onSuccess(
        `Đã đặt lại mật khẩu thành công cho tài khoản "${user.fullName}". Mọi phiên đăng nhập cũ đã được thu hồi bảo mật tự động.`
      );
      onClose();
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.errors && apiErr.errors.length > 0) {
        setServerError(apiErr.errors.join(". "));
      } else {
        setServerError(apiErr.message);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#121314]/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9E6] text-[#7A5B00] text-lg">
              🔑
            </span>
            <div>
              <h3 id="reset-password-modal-title" className="text-base font-bold text-foreground">
                Đặt lại mật khẩu
              </h3>
              <p className="text-xs text-muted">
                Cấp mật khẩu mới cho người dùng khi quên hoặc cần làm mới phiên
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={resetPassword.isPending}
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 rounded-xl border border-danger-border bg-danger-bg p-3.5 text-xs text-danger flex items-start gap-2 animate-in fade-in">
            <span className="text-sm shrink-0">⚠️</span>
            <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* User Info Overview */}
        <div className="mt-4 rounded-2xl bg-background/60 border border-border p-3.5">
          <p className="text-xs text-muted">Đặt lại mật khẩu cho tài khoản:</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{user.fullName}</p>
          <p className="text-xs text-muted mt-0.5">{user.email}</p>
        </div>

        {/* Warning Box Pastel (D48 Token Revocation) */}
        <div className="mt-4 rounded-2xl bg-[#FFF9E6] border border-[#FFF3DD] p-3.5 text-xs text-[#7A5B00]">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Cảnh báo thu hồi phiên đăng nhập (D48):</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed">
            Đặt lại mật khẩu sẽ thu hồi lập tức tất cả token đăng nhập hiện có của người dùng trên mọi thiết bị. Người dùng sẽ phải đăng nhập lại với mật khẩu mới.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <FormField
            id="newPassword"
            label="Mật khẩu mới"
            required
            hint="Từ 8 đến 128 ký tự"
            error={errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu mới cho người dùng..."
              error={errors.newPassword?.message}
              disabled={resetPassword.isPending}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted hover:text-foreground text-xs font-semibold px-1 py-0.5 cursor-pointer"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              }
              {...register("newPassword", {
                required: "Mật khẩu không được để trống.",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải từ 8 đến 128 ký tự.",
                },
                maxLength: {
                  value: 128,
                  message: "Mật khẩu phải từ 8 đến 128 ký tự.",
                },
              })}
            />
          </FormField>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={resetPassword.isPending}
              onClick={handleClose}
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={resetPassword.isPending}
              className="rounded-full px-6 py-2 text-xs font-bold"
            >
              Lưu mật khẩu mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
