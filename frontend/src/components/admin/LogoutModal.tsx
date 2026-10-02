"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  async function handleConfirmLogout() {
    setIsSubmitting(true);
    try {
      // D48: AuthContext trên develop đã tự gọi POST /api/auth/logout và chuyển về /login
      await logout();
      onClose();
    } catch {
      onClose();
    }
  }

  return (
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl p-6 sm:p-7 shadow-xl border border-border relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-4 mx-auto border border-danger-border">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-lg font-bold text-foreground">
            Xác nhận đăng xuất
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Bạn có chắc chắn muốn kết thúc phiên làm việc Quản trị viên hiện tại không?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border border-border text-muted hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmLogout}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-danger hover:bg-danger/90 text-white shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
