"use client";

import React, { useState, useEffect } from "react";
import { useChangeRole } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { UserRoleBadge } from "./UserRoleBadge";
import { USER_ROLES } from "@/types/user";
import type { UserResponse } from "@/types/user";
import type { Role } from "@/types/auth";

interface ChangeRoleModalProps {
  user: UserResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ChangeRoleModal({ user, isOpen, onClose, onSuccess }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [serverError, setServerError] = useState<string | null>(null);
  const changeRole = useChangeRole();

  const handleClose = () => {
    if (changeRole.isPending) return;
    setSelectedRole("");
    setServerError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !changeRole.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, user, onClose, changeRole.isPending]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setServerError("Vui lòng chọn vai trò mới cho tài khoản.");
      return;
    }
    if (selectedRole === user.role) {
      setServerError("Tài khoản này đã có vai trò này.");
      return;
    }

    try {
      await changeRole.mutateAsync({
        id: user.id,
        data: { role: selectedRole },
      });

      const roleObj = USER_ROLES.find((r) => r.value === selectedRole);
      setSelectedRole("");
      setServerError(null);
      onSuccess(
        `Đã đổi vai trò của "${user.fullName}" thành [${roleObj?.label ?? selectedRole}]. Mọi phiên đăng nhập cũ đã được thu hồi bảo mật tự động.`
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
      aria-labelledby="change-role-modal-title"
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F0FF] text-[#583F8C] text-lg">
              🛡️
            </span>
            <div>
              <h3 id="change-role-modal-title" className="text-base font-bold text-foreground">
                Đổi vai trò người dùng
              </h3>
              <p className="text-xs text-muted">
                Điều chỉnh quyền hạn truy cập theo 5 vai trò hệ thống
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={changeRole.isPending}
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
        <div className="mt-4 rounded-2xl bg-background/60 border border-border p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Tài khoản được điều chỉnh:</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{user.fullName}</p>
            <p className="text-xs text-muted mt-0.5">{user.email}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted block mb-1">Vai trò hiện tại:</span>
            <UserRoleBadge role={user.role} />
          </div>
        </div>

        {/* Warning Box Pastel (D48 Token Revocation) */}
        <div className="mt-4 rounded-2xl bg-[#FFF9E6] border border-[#FFF3DD] p-3.5 text-xs text-[#7A5B00]">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Cảnh báo thu hồi phiên đăng nhập (D48):</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed">
            Khi đổi vai trò, mọi phiên đăng nhập cũ của tài khoản này trên tất cả các thiết bị sẽ bị thu hồi lập tức. Người dùng sẽ phải đăng nhập lại để nhận quyền hạn mới.
          </p>
        </div>

        {/* Role Selection Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-2">
              Chọn vai trò công tác mới: <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USER_ROLES.map((r) => {
                const isCurrent = r.value === user.role;
                const isSelected = selectedRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    disabled={isCurrent || changeRole.isPending}
                    onClick={() => {
                      setSelectedRole(r.value);
                      setServerError(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? "bg-background/40 border-border/50 text-muted opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#E8F8F1] border-[#55B38F] text-[#1A624C] ring-2 ring-[#55B38F]/20 shadow-xs"
                        : "bg-card border-border text-foreground hover:bg-background/80 hover:border-border-hover cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs">{r.label}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-muted bg-border/50 px-1.5 py-0.5 rounded-full">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted mt-1 leading-snug">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={changeRole.isPending}
              onClick={handleClose}
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedRole || selectedRole === user.role}
              isLoading={changeRole.isPending}
              className="rounded-full px-6 py-2 text-xs font-bold"
            >
              Xác nhận đổi vai trò
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
