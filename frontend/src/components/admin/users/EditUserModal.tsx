"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateUser } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    },
  });

  const handleClose = () => {
    if (updateUser.isPending) return;
    setServerError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    // Sync form values when user changes without causing state loop
    reset({
      fullName: user.fullName,
      email: user.email,
    });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !updateUser.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, user, reset, onClose, updateUser.isPending]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-modal-title"
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
              ✏️
            </span>
            <div>
              <h3 id="edit-user-modal-title" className="text-base font-bold text-foreground">
                Sửa thông tin tài khoản
              </h3>
              <p className="text-xs text-muted">
                Cập nhật họ tên và địa chỉ email định danh của người dùng
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Full Name */}
          <FormField
            id="editFullName"
            label="Họ và tên"
            required
            hint="Tối đa 100 ký tự"
            error={errors.fullName?.message}
          >
            <Input
              id="editFullName"
              placeholder="Nhập họ và tên..."
              error={errors.fullName?.message}
              disabled={updateUser.isPending}
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
            id="editEmail"
            label="Email công vụ / liên hệ"
            required
            hint="Tối đa 254 ký tự"
            error={errors.email?.message}
          >
            <Input
              id="editEmail"
              type="email"
              placeholder="Nhập email..."
              error={errors.email?.message}
              disabled={updateUser.isPending}
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

          <p className="text-[11px] text-muted italic">
            * Lưu ý: Thay đổi email sẽ áp dụng khi người dùng đăng nhập lần tiếp theo. Để đổi vai trò hoặc đặt lại mật khẩu, vui lòng sử dụng nút chức năng tương ứng trên bảng.
          </p>

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
