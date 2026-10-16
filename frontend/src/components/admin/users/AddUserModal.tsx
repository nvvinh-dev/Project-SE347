"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useCreateUser } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { USER_ROLES } from "@/types/user";
import type { Role } from "@/types/auth";

interface AddUserFormData {
  fullName: string;
  email: string;
  password: string;
  role: Role | "";
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const createUser = useCreateUser();
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUserFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "", // AC-USER-06 & D43 mục 5: Tuyệt đối không có giá trị chọn sẵn
    },
  });

  const handleClose = useCallback(() => {
    if (createUser.isPending) return;
    setServerError(null);
    setShowPassword(false);
    reset({
      fullName: "",
      email: "",
      password: "",
      role: "",
    });
    onClose();
  }, [createUser.isPending, reset, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!createUser.isPending) {
          handleClose();
        }
        return;
      }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleClose, createUser.isPending]);

  if (!isOpen) return null;

  const onSubmit = async (data: AddUserFormData) => {
    setServerError(null);

    // Validate role explicitly
    if (!data.role) {
      setServerError("Vui lòng chọn vai trò cho tài khoản.");
      return;
    }

    try {
      const trimmedFullName = data.fullName.trim();
      const trimmedEmail = data.email.trim().toLowerCase();
      // Mật khẩu KHÔNG TRIM theo D20 & UserRuleExtensions
      const rawPassword = data.password;

      await createUser.mutateAsync({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password: rawPassword,
        role: data.role as Role,
      });

      const roleObj = USER_ROLES.find((r) => r.value === data.role);
      setServerError(null);
      setShowPassword(false);
      reset({
        fullName: "",
        email: "",
        password: "",
        role: "",
      });
      onSuccess(
        `Đã tạo tài khoản thành công cho "${trimmedFullName}" với vai trò [${roleObj?.label ?? data.role}].`
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand text-lg">
              👤➕
            </span>
            <div>
              <h3 id="add-user-modal-title" className="text-base font-bold text-foreground">
                Thêm tài khoản mới
              </h3>
              <p className="text-xs text-muted">
                Tạo tài khoản cán bộ giáo viên hoặc phụ huynh học sinh
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={createUser.isPending}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Full Name */}
          <FormField
            id="fullName"
            label="Họ và tên"
            required
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              placeholder="Ví dụ: Nguyễn Văn A"
              disabled={createUser.isPending}
              {...register("fullName", {
                required: "Họ và tên không được để trống.",
                minLength: {
                  value: 1,
                  message: "Họ và tên phải có ít nhất 1 ký tự.",
                },
                maxLength: {
                  value: 100,
                  message: "Họ và tên không được vượt quá 100 ký tự.",
                },
                validate: (v) =>
                  v.trim().length > 0 || "Họ và tên không được chỉ chứa khoảng trắng.",
              })}
            />
          </FormField>

          {/* Email */}
          <FormField
            id="email"
            label="Địa chỉ email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="Ví dụ: nva@nhatre.local"
              disabled={createUser.isPending}
              {...register("email", {
                required: "Địa chỉ email không được để trống.",
                maxLength: {
                  value: 254,
                  message: "Email không được vượt quá 254 ký tự.",
                },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Định dạng email không hợp lệ.",
                },
              })}
            />
          </FormField>

          {/* Password */}
          <FormField
            id="password"
            label="Mật khẩu khởi tạo"
            required
            error={errors.password?.message}
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập từ 8 đến 128 ký tự..."
                disabled={createUser.isPending}
                className="pr-12"
                {...register("password", {
                  required: "Mật khẩu không được để trống.",
                  minLength: {
                    value: 8,
                    message: "Mật khẩu phải có tối thiểu 8 ký tự.",
                  },
                  maxLength: {
                    value: 128,
                    message: "Mật khẩu không được vượt quá 128 ký tự.",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-foreground cursor-pointer px-1 py-0.5"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </FormField>

          {/* Role Select: AC-USER-06 Tuyệt đối không chọn sẵn */}
          <FormField
            id="role"
            label="Vai trò hệ thống"
            required
            error={errors.role?.message}
          >
            <Select
              id="role"
              placeholder="-- Chọn vai trò --"
              options={USER_ROLES.map((r) => ({
                value: r.value,
                label: `${r.label} (${r.desc})`,
              }))}
              disabled={createUser.isPending}
              {...register("role", {
                required: "Vui lòng chọn vai trò cho tài khoản.",
              })}
            />
          </FormField>

          {/* Security note - AC-USER-05 */}
          {/* PasswordHasher V3 */}
          <div className="rounded-2xl bg-brand-subtle/70 border border-brand-border/60 p-3 text-xs text-brand-text">
            <p className="font-semibold flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Quy định bảo mật danh tính:</span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Mật khẩu sẽ được băm một chiều an toàn ngay tại máy chủ. Hệ thống không lưu bản rõ và không bao giờ hiển thị lại mật khẩu này.
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={createUser.isPending}
              onClick={handleClose}
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createUser.isPending}
              className="rounded-full px-6 py-2 text-xs font-bold"
            >
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
