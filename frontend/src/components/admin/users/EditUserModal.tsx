"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useUpdateUser } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { UserResponse } from "@/types/user";

interface EditUserFormData {
  fullName: string;
  email: string;
}

interface EditUserModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function EditUserModal({ user, isOpen, onClose, onSuccess }: EditUserModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateUser = useUpdateUser();

  // Form được mount với key={user.id} ở cấp cha, nên defaultValues luôn khởi tạo mới theo từng người dùng
  // và không bị ghi đè khi submit form (giúp bảo toàn dữ liệu vừa nhập khi gặp lỗi 409 Conflict).
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormData>({
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    },
  });

  const handleClose = useCallback(() => {
    if (updateUser.isPending) return;
    setServerError(null);
    onClose();
  }, [updateUser.isPending, onClose]);

  const { containerRef } = useFocusTrap({
    isOpen: isOpen && user !== null,
    isLoading: updateUser.isPending,
    onClose: handleClose,
  });

  if (!isOpen || !user) return null;

  const onSubmit = async (data: EditUserFormData) => {
    setServerError(null);

    try {
      const trimmedFullName = data.fullName.trim();
      const trimmedEmail = data.email.trim().toLowerCase();

      await updateUser.mutateAsync({
        id: user.id,
        data: {
          fullName: trimmedFullName,
          email: trimmedEmail,
        },
      });

      setServerError(null);
      onSuccess(`Đã cập nhật thông tin tài khoản cho "${trimmedFullName}".`);
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
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full max-w-lg my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand text-lg">
              ✏️
            </span>
            <div>
              <h3 id="edit-user-modal-title" className="text-base font-bold text-foreground">
                Chỉnh sửa thông tin
              </h3>
              <p className="text-xs text-muted">
                Cập nhật họ tên hoặc địa chỉ email của người dùng
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={updateUser.isPending}
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

        {/* Current info note */}
        <div className="mt-4 rounded-2xl bg-background/60 border border-border p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted block">Mã tài khoản (ID):</span>
            <span className="text-xs font-mono font-medium text-foreground">{user.id}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted block">Vai trò:</span>
            <span className="text-xs font-bold text-brand-text">{user.role}</span>
          </div>
        </div>

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
              placeholder="Nhập họ và tên..."
              disabled={updateUser.isPending}
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
              placeholder="Nhập địa chỉ email..."
              disabled={updateUser.isPending}
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

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={updateUser.isPending}
              onClick={handleClose}
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateUser.isPending}
              className="rounded-full px-6 py-2 text-xs font-bold"
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
