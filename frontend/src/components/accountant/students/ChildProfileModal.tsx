"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useApiError } from "@/hooks/useApiError";
import {
  useChild,
  useCreateChild,
  useLinkGuardian,
  useUnlinkGuardian,
  useUpdateChild,
} from "@/hooks/useChildren";
import { cn } from "@/lib/utils";
import type { ChildProfileRequest, ChildResponse, GuardianResponse } from "@/types/children";
import { ChildProfileForm } from "./ChildProfileForm";
import { GuardiansPanel } from "./GuardiansPanel";

interface ChildProfileModalProps {
  childId?: string;
  onCreated: (child: ChildResponse) => void;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ChildProfileModal({ childId, onCreated, onClose, onSuccess }: ChildProfileModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const unlinkTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<GuardianResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const detail = useChild(childId ?? "");
  const create = useCreateChild();
  const update = useUpdateChild();
  const link = useLinkGuardian();
  const unlink = useUnlinkGuardian();
  const linkError = useApiError();
  const unlinkError = useApiError();
  const isSaving = create.isPending || update.isPending;
  const isBusy = isSaving || link.isPending || unlink.isPending;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    // showModal đưa popup lên top layer, giữ focus bên trong và vô hiệu hóa nền.
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // ConfirmDialog cũng khóa cuộn; dọn lần cuối sau cleanup của modal con khi rời trang.
      queueMicrotask(() => {
        if (!document.querySelector("dialog[open], [aria-modal='true']")) {
          document.body.style.overflow = previousOverflow;
        }
      });
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const notify = (message: string) => {
    setNotice(message);
    onSuccess(message);
  };

  const requestClose = () => {
    if (!isBusy && !unlinkTarget) onClose();
  };

  const dismissUnlink = () => {
    setUnlinkTarget(null);
    unlinkError.clearError();
    requestAnimationFrame(() => {
      const trigger = unlinkTriggerRef.current;
      if (trigger?.isConnected) trigger.focus();
      else dialogRef.current?.querySelector<HTMLInputElement>("#parent-search")?.focus();
    });
  };

  const saveProfile = async (payload: ChildProfileRequest) => {
    setNotice(null);
    const saved = childId
      ? await update.mutateAsync({ id: childId, data: payload })
      : await create.mutateAsync(payload);

    if (childId) {
      notify(`Đã cập nhật hồ sơ cho ${saved.fullName}.`);
    } else {
      notify(`Đã tạo hồ sơ cho ${saved.fullName}. Bạn có thể liên kết tài khoản trong mục Phụ huynh.`);
      onCreated(saved);
    }
    return saved;
  };

  const linkGuardian = (guardian: GuardianResponse) => {
    if (!childId || isBusy) return;
    setNotice(null);
    linkError.clearError();
    link.mutate({ childId, data: { guardianUserId: guardian.userId } }, {
      onSuccess: () => notify(`Đã liên kết phụ huynh ${guardian.fullName}.`),
      onError: linkError.handleError,
    });
  };

  const confirmUnlink = () => {
    if (!childId || !unlinkTarget || isBusy) return;
    setNotice(null);
    unlinkError.clearError();
    const guardian = unlinkTarget;
    unlink.mutate({ childId, guardianUserId: guardian.userId }, {
      onSuccess: () => {
        dismissUnlink();
        notify(`Đã gỡ liên kết phụ huynh ${guardian.fullName}.`);
      },
      onError: unlinkError.handleError,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className={cn(
        "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl outline-none backdrop:bg-black/40 backdrop:backdrop-blur-xs",
        childId ? "max-w-4xl" : "max-w-lg"
      )}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDownCapture={(event) => {
        // Escape ở hộp xác nhận chỉ đóng hộp đó, không đóng luôn popup hồ sơ.
        if (event.key === "Escape" && unlinkTarget) {
          event.preventDefault();
          event.stopPropagation();
          if (!unlink.isPending) dismissUnlink();
          return;
        }
        if (event.key !== "Tab" || unlinkTarget) return;

        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex='0']"
        )).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        const active = document.activeElement;

        if (!first || !last) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) requestClose();
      }}
    >
      <div inert={!!unlinkTarget} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight sm:text-xl">
              {childId ? "Chỉnh sửa hồ sơ trẻ" : "Thêm hồ sơ trẻ"}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">
              {childId ? detail.data?.fullName ?? "Thông tin nhập học và phụ huynh của trẻ" : "Nhập thông tin nhập học của trẻ."}
            </p>
          </div>
          <Button
            variant="ghost" size="sm" disabled={isBusy} onClick={requestClose}
            aria-label="Đóng popup hồ sơ" className="h-9 w-9 shrink-0 p-0!"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={1.75} d="m6 6 12 12M6 18 18 6" />
            </svg>
          </Button>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {notice && (
            <p role="status" className="mb-5 rounded-xl border border-brand-border bg-brand-subtle p-3 text-sm leading-relaxed text-brand-text [overflow-wrap:anywhere]">
              {notice}
            </p>
          )}

          {childId && detail.isLoading ? (
            <StatusMessage status="loading" title="Đang tải hồ sơ trẻ..." />
          ) : childId && detail.isError ? (
            <StatusMessage
              status="error" title="Không thể tải hồ sơ trẻ" message={detail.error.message}
              onRetry={() => { void detail.refetch(); }}
            />
          ) : childId && !detail.data ? (
            <StatusMessage status="empty" message="Không tìm thấy hồ sơ trẻ." />
          ) : (
            <div className={cn("grid min-w-0 gap-6", childId && "md:grid-cols-2")}>
              <section aria-labelledby="child-profile-title" className="min-w-0">
                <h3 id="child-profile-title" className="mb-5 text-base font-semibold">Thông tin hồ sơ</h3>
                <ChildProfileForm
                  key={childId ?? "create"}
                  child={detail.data ?? undefined}
                  isBusy={isBusy}
                  isSaving={isSaving}
                  onSave={saveProfile}
                  onCancel={requestClose}
                />
                {!childId && (
                  <p className="mt-5 rounded-lg bg-brand-subtle p-3 text-xs leading-relaxed text-brand-text">
                    Sau khi lưu hồ sơ, bạn có thể tìm và liên kết tài khoản phụ huynh.
                  </p>
                )}
              </section>

              {childId && (
                <div className="min-w-0 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                  <GuardiansPanel
                    key={childId}
                    childId={childId}
                    isBusy={isBusy}
                    linkingUserId={link.isPending ? link.variables?.data.guardianUserId : undefined}
                    errorMessage={linkError.errorMessage}
                    onLink={linkGuardian}
                    onUnlink={(guardian, trigger) => {
                      if (isBusy) return;
                      unlinkTriggerRef.current = trigger;
                      unlinkError.clearError();
                      setUnlinkTarget(guardian);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!unlinkTarget}
        title="Gỡ liên kết phụ huynh?"
        variant="destructive"
        description={
          <div className="space-y-3 [overflow-wrap:anywhere]">
            <p>
              Gỡ liên kết giữa phụ huynh <strong>{unlinkTarget?.fullName}</strong>
              {" "}({unlinkTarget?.email}) và trẻ <strong>{detail.data?.fullName}</strong>?
            </p>
            {unlinkError.errorMessage && <p role="alert" className="text-danger">{unlinkError.errorMessage}</p>}
          </div>
        }
        confirmText="Gỡ liên kết"
        isLoading={unlink.isPending}
        onConfirm={confirmUnlink}
        onClose={dismissUnlink}
      />
    </dialog>
  );
}
