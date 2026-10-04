"use client";

import React, { useEffect, useRef, useId, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "destructive";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Bọc onClose trong ref để tránh re-register event khi reference thay đổi
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onCloseRef.current();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    // Lưu lại giá trị overflow cũ để khôi phục khi đóng
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Khóa cuộn trang khi dialog mở
    document.body.style.overflow = "hidden";

    // Focus vào nút Hủy khi mở dialog
    requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Trả overflow về giá trị cũ thay vì "unset"
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl transition-all">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              variant === "destructive"
                ? "bg-danger/10 text-danger"
                : "bg-brand-subtle text-brand"
            )}
          >
            {variant === "destructive" ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h3>
            <div className="mt-2 text-sm text-muted">{description}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            ref={cancelRef}
            variant="secondary"
            disabled={isLoading}
            onClick={handleClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "primary"}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
