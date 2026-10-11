"use client";

import React, { useState, useEffect } from "react";
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

  const handleClose = () => {
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
  };

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createUser.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, createUser.isPending]);

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

      reset();
      setServerError(null);
      setShowPassword(false);
      onSuccess(`Đã tạo thành công tài khoản cho "${trimmedFullName}" (${trimmedEmail}).`);
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
      aria-labelledby="add-user-modal-title"
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand text-lg">
              👤
            </span>
            <div>
              <h3 id="add-user-modal-title" className="text-base font-bold text-foreground">
                Thêm tài khoản mới
              </h3>
              <p className="text-xs text-muted">
                Cấp tài khoản người dùng và thiết lập 1 trong 5 vai trò hệ thống
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
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Full Name */}
          <FormField
            id="fullName"
            label="Họ và tên"
            required
            hint="Tối đa 100 ký tự"
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              placeholder="Ví dụ: Nguyễn Văn Vinh"
              error={errors.fullName?.message}
              disabled={createUser.isPending}
              {...register("fullName", {
                required: "Họ tên không được để trống.",
                validate: (val) => {
                  const trimmed = val.trim();
                  if (trimmed.length === 0) return "Họ tên không được để trống.";
                  if (trimmed.length > 100) return "Họ tên không được dài quá 100 ký tự.";
                  return true;
                },
              })}
            />
          </FormField>

          {/* Email */}
          <FormField
            id="email"
            label="Email công vụ / liên hệ"
            required
            hint="Tối đa 254 ký tự"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="Ví dụ: giaovien@nhatre.local hoặc phuhuynh@gmail.com"
              error={errors.email?.message}
              disabled={createUser.isPending}
              {...register("email", {
                required: "Email không được để trống.",
                validate: (val) => {
                  const trimmed = val.trim();
                  if (trimmed.length === 0) return "Email không được để trống.";
                  if (trimmed.length > 254) return "Email không được dài quá 254 ký tự.";
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(trimmed)) return "Email không đúng định dạng.";
                  return true;
                },
              })}
            />
          </FormField>

          {/* Password (No trim!) */}
          <FormField
            id="password"
            label="Mật khẩu khởi tạo"
            required
            hint="Từ 8 đến 128 ký tự"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu an toàn ban đầu..."
              error={errors.password?.message}
              disabled={createUser.isPending}
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
              {...register("password", {
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

          {/* Role (AC-USER-06, D43 mục 5: Không có giá trị mặc định) */}
          <FormField
            id="role"
            label="Vai trò hệ thống"
            required
            hint="Bắt buộc chọn tường minh"
            error={errors.role?.message}
          >
            <Select
              id="role"
              placeholder="-- Chọn vai trò --"
              options={USER_ROLES.map((r) => ({
                value: r.value,
                label: `${r.label} (${r.desc})`,
              }))}
              error={errors.role?.message}
              disabled={createUser.isPending}
              {...register("role", {
                required: "Vui lòng chọn vai trò cho tài khoản.",
              })}
            />
          </FormField>

          {/* Security note */}
          <div className="rounded-2xl bg-brand-subtle/70 border border-brand-border/60 p-3 text-xs text-brand-text">
            <p className="font-semibold flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Quy định bảo mật danh tính:</span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Mật khẩu sẽ được băm một chiều an toàn (PasswordHasher V3) ngay tại máy chủ. Hệ thống không lưu bản rõ và không bao giờ hiển thị lại mật khẩu này.
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
