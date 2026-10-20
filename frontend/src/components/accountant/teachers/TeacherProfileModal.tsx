"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCreateTeacher, useTeacher } from "@/hooks/useTeachers";
import type { TeacherResponse } from "@/types/teachers";
import { CreateTeacherForm } from "./CreateTeacherForm";

interface TeacherProfileModalProps {
  teacherId?: string;
  onCreated: (teacher: TeacherResponse) => void;
  onClose: () => void;
}

export function TeacherProfileModal({ teacherId, onCreated, onClose }: TeacherProfileModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const backdropPointerRef = useRef<number | null>(null);
  const backdropClickRef = useRef(false);
  const detail = useTeacher(teacherId ?? "");
  const create = useCreateTeacher();
  const { containerRef } = useFocusTrap({
    isOpen: true,
    isLoading: create.isPending,
    onClose,
    initialFocusRef: teacherId ? undefined : searchRef,
  });
  const teacher = detail.data;
  const requestClose = () => { if (!create.isPending) onClose(); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onPointerDown={(event) => {
        backdropClickRef.current = false;
        backdropPointerRef.current = event.button === 0 && event.target === event.currentTarget
          ? event.pointerId : null;
      }}
      onPointerUp={(event) => {
        backdropClickRef.current = event.target === event.currentTarget
          && backdropPointerRef.current === event.pointerId;
        backdropPointerRef.current = null;
      }}
      onPointerCancel={() => {
        backdropPointerRef.current = null;
        backdropClickRef.current = false;
      }}
      onClick={(event) => {
        const shouldClose = backdropClickRef.current && event.target === event.currentTarget;
        backdropClickRef.current = false;
        if (shouldClose) requestClose();
      }}
    >
      <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId}
        aria-describedby={descriptionId} tabIndex={-1}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl outline-none">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight sm:text-xl">
              {teacherId ? "Hồ sơ giáo viên" : "Thêm hồ sơ giáo viên"}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted">
              {teacherId ? "Thông tin giáo viên phục vụ phân công lớp."
                : "Chọn tài khoản giáo viên có sẵn để lập hồ sơ."}
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Đóng popup hồ sơ giáo viên"
            className="h-9 w-9 shrink-0 p-0!" disabled={create.isPending} onClick={requestClose}>
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={1.75} d="m6 6 12 12M6 18 18 6" />
            </svg>
          </Button>
        </header>

        {!teacherId ? (
          <CreateTeacherForm isBusy={create.isPending} initialFocusRef={searchRef}
            onClose={requestClose}
            onSave={async (payload) => {
              const saved = await create.mutateAsync(payload);
              onCreated(saved);
            }} />
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
              {detail.isError && teacher && (
                <div role="alert" className="space-y-3 rounded-xl border border-danger-border bg-danger-bg p-4">
                  <p className="text-sm text-danger">Chưa thể làm mới hồ sơ. Đang hiển thị thông tin đã tải trước đó.</p>
                  <p className="text-xs text-danger">{detail.error.message}</p>
                  <Button size="sm" variant="secondary" disabled={detail.isFetching}
                    onClick={() => { void detail.refetch(); }}>Thử lại</Button>
                </div>
              )}
              {detail.isLoading ? (
                <StatusMessage status="loading" title="Đang tải hồ sơ giáo viên..." />
              ) : detail.isError && !teacher ? (
                <StatusMessage status="error" title="Không thể tải hồ sơ giáo viên"
                  message={detail.error.message} onRetry={() => { void detail.refetch(); }} />
              ) : !teacher ? (
                <StatusMessage status="empty" message="Không tìm thấy hồ sơ giáo viên." />
              ) : (
                <>
                  <dl className="space-y-5 [overflow-wrap:anywhere]">
                    <div>
                      <dt className="text-xs font-semibold text-muted">Họ tên</dt>
                      <dd className="mt-1.5 text-base font-medium">{teacher.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted">Email</dt>
                      <dd className="mt-1.5 text-sm">{teacher.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted">Ngày lập hồ sơ</dt>
                      <dd className="mt-1.5 text-sm">{new Date(teacher.createdAtUtc).toLocaleString("vi-VN")}</dd>
                    </div>
                  </dl>
                  <p className="rounded-xl border border-brand-border bg-brand-subtle p-4 text-xs leading-relaxed text-brand-text">
                    Họ tên và email được quản lý bởi Admin. Liên hệ Admin khi cần cập nhật thông tin tài khoản.
                  </p>
                </>
              )}
            </div>
            <footer className="flex shrink-0 justify-end border-t border-border px-5 py-4 sm:px-6">
              <Button variant="secondary" onClick={requestClose}>Đóng</Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
