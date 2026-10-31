"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getHomeroomChildren } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import IncidentForm from "./IncidentForm";
import QuickHealthForm from "./QuickHealthForm";
import RecordDetailModal from "./RecordDetailModal";
import {
  formatRecordTime,
  clearLegacyRecentRecords,
  getRecentRecords,
  getServerRecentRecords,
  subscribeRecentRecords,
  type FormActivity,
  type RecentRecordItem,
} from "./_lib/health-incidents";

type Mode = "health" | "incident";

interface Selection {
  childId: string;
  mode: Mode;
}

export default function IncidentsScreen() {
  const { user } = useAuth();
  return user ? <HealthWorkspace key={user.userId} userId={user.userId} /> : null;
}

function HealthWorkspace({ userId }: { userId: string }) {
  const selector = useForm<{ childId: string }>({ defaultValues: { childId: "" } });
  const childId = useWatch({ control: selector.control, name: "childId" });
  const [mode, setMode] = useState<Mode>("health");
  const [activity, setActivity] = useState<FormActivity>({ dirty: false, locked: false });
  const [change, setChange] = useState<Selection | null>(null);
  const recentRecords = useSyncExternalStore(
    subscribeRecentRecords,
    () => getRecentRecords(userId),
    getServerRecentRecords
  );
  const [viewingRecord, setViewingRecord] = useState<RecentRecordItem | null>(null);
  const closeRecord = useCallback(() => setViewingRecord(null), []);
  const changeTrigger = useRef<HTMLElement | null>(null);

  const children = useApiQuery({
    queryKey: ["teacher-homeroom-children", userId],
    queryFn: ({ signal }) => getHomeroomChildren(signal),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const child = children.data?.find((item) => item.id === childId);
  const visibleRecords = children.isSuccess
    ? recentRecords.filter((item) => children.data.some((entry) => entry.id === item.childId))
    : [];

  useEffect(() => { clearLegacyRecentRecords(userId); }, [userId]);

  const onActivity = useCallback((next: FormActivity) => {
    setActivity((current) =>
      current.dirty === next.dirty && current.locked === next.locked ? current : next
    );
  }, []);

  useEffect(() => {
    if (!activity.dirty && !activity.locked) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [activity.dirty, activity.locked]);

  function applySelection(next: Selection) {
    selector.setValue("childId", next.childId);
    setMode(next.mode);
    setActivity({ dirty: false, locked: false });
    setChange(null);
  }

  function requestSelection(next: Selection) {
    if (activity.locked || (next.childId === childId && next.mode === mode)) return;
    changeTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (activity.dirty) {
      setChange(next);
    } else {
      applySelection(next);
    }
  }

  function closeChange() {
    setChange(null);
    selector.setValue("childId", childId);
    requestAnimationFrame(() => {
      const el = document.getElementById("health-child") as HTMLSelectElement | null;
      if (el && el.value !== childId) {
        el.value = childId;
      }
      changeTrigger.current?.focus({ preventScroll: true });
    });
  }



  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Sức khỏe & Sự cố"
        description="Ghi nhận tình trạng sức khỏe nhanh và báo cáo sự cố phát sinh của trẻ trong lớp bạn chủ nhiệm"
      />

      <section
        className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all"
        aria-label="Khu vực ghi nhận sức khỏe và sự cố"
      >
        {/* Thanh chọn trẻ và loại tác vụ — đồng nhất với pattern p-4 border-b của các màn hình khác */}
        <form
          className="flex w-full min-w-0 flex-col items-stretch gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-end"
          aria-label="Chọn trẻ cần ghi nhận"
          onSubmit={(event) => event.preventDefault()}
        >
          {/* Select chọn trẻ — chiếm phần còn lại */}
          <FormField
            id="health-child"
            label="Ghi nhận cho trẻ"
            required
            hint="Chỉ hiển thị trẻ thuộc lớp chủ nhiệm"
            className="min-w-0 flex-1"
          >
            <div className="relative">
              <Select
                id="health-child"
                className={cn("min-h-11 min-w-0", child?.healthNotes && "pr-14")}
                placeholder={
                  children.isPending
                    ? "Đang tải danh sách trẻ..."
                    : children.isError
                      ? "Không tải được danh sách"
                      : "Chọn họ tên trẻ trong lớp..."
                }
                disabled={activity.locked || children.isPending || children.isError || !children.data?.length}
                options={(children.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.fullName,
                }))}
                {...selector.register("childId")}
                value={childId}
                onChange={(event) => requestSelection({ childId: event.target.value, mode })}
              />
              {child?.healthNotes && (
                <div
                  className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 flex items-center"
                  title={`Lưu ý sức khỏe: ${child.healthNotes}`}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-warning-border bg-warning-bg text-[10px] font-bold text-warning"
                  >
                    !
                  </span>
                </div>
              )}
            </div>
          </FormField>

          {/* Dropdown chọn loại tác vụ — cùng hàng với select, đồng nhất với pattern Select của hệ thống */}
          <FormField id="health-mode" label="Loại tác vụ" className="sm:w-44 sm:shrink-0">
            <Select
              id="health-mode"
              className="min-h-11"
              disabled={activity.locked}
              value={mode}
              options={[
                { value: "health", label: "Sức khỏe nhanh" },
                { value: "incident", label: "Ghi sự cố" },
              ]}
              onChange={(event) =>
                requestSelection({ childId, mode: event.target.value as Mode })
              }
            />
          </FormField>
        </form>

        {/* Thân trang: Card hiển thị thông tin trẻ hoặc các trạng thái Loading/Error/Empty */}
        <div className="p-4 pt-3 sm:pt-3.5">
          {children.isPending ? (
            <StatusMessage status="loading" title="Đang tải danh sách trẻ lớp chủ nhiệm..." />
          ) : children.isError ? (
            <StatusMessage
              status="error"
              title="Không thể tải danh sách trẻ"
              message={children.error.message}
              onRetry={() => void children.refetch()}
            />
          ) : !children.data?.length ? (
            <StatusMessage
              status="empty"
              title="Chưa có trẻ trong lớp chủ nhiệm"
              message="Danh sách trẻ sẽ xuất hiện khi bạn được phân công lớp và lớp đã có trẻ nhập học."
            />
          ) : !child ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-8 sm:p-10 text-center">
              <div
                className={cn(
                  "mb-3 flex h-12 w-12 items-center justify-center rounded-full border",
                  mode === "health"
                    ? "bg-brand-subtle text-brand border-brand-border/60"
                    : "bg-warning-bg text-warning border-warning-border/60"
                )}
              >
                {mode === "health" ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>

              <h4 className="text-sm font-semibold text-foreground">
                {mode === "health"
                  ? "Bạn muốn ghi nhận sức khỏe cho trẻ nào?"
                  : "Bạn muốn ghi nhận sự cố cho trẻ nào?"}
              </h4>

              <p className="mt-1 max-w-md text-xs text-muted">
                Vui lòng chọn họ tên trẻ từ danh sách lớp ở trên để bắt đầu{" "}
                <strong className="font-semibold text-foreground">
                  {mode === "health" ? "ghi nhận sức khỏe" : "ghi nhận sự cố"}
                </strong>
                .
              </p>

              {Boolean(children.data?.length) && (
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 max-w-lg">
                  {children.data?.map((item) => (
                    <Button
                      variant="outline"
                      size="sm"
                      key={item.id}
                      type="button"
                      disabled={activity.locked}
                      onClick={() => requestSelection({ childId: item.id, mode })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs hover:border-brand-border hover:bg-brand-subtle hover:text-brand-text transition-colors cursor-pointer"
                    >
                      <span>{item.fullName}</span>
                      {item.healthNotes?.trim() && (
                        <span
                          title={`Lưu ý sức khỏe: ${item.healthNotes}`}
                          aria-label={`Lưu ý sức khỏe: ${item.fullName}`}
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-warning-border bg-warning-bg text-[10px] font-bold text-warning"
                        >
                          !
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Banner Lưu ý sức khỏe đặc biệt từ Y tế nếu có */}
              {child.healthNotes && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-bg/70 px-4 py-3 text-xs leading-relaxed text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-warning-border bg-warning-bg text-[10px] font-bold text-warning"
                  >
                    !
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-warning">Lưu ý y tế đặc biệt: </span>
                    <span className="font-medium whitespace-pre-wrap wrap-anywhere">
                      {child.healthNotes}
                    </span>
                  </div>
                </div>
              )}

              {/* Form nhập liệu trực tiếp, không bọc thêm khung lồng khung */}
              <div>
                {mode === "health" ? (
                  <QuickHealthForm
                    key={`health:${child.id}`}
                    child={child}
                    userId={userId}
                    onActivity={onActivity}
                  />
                ) : (
                  <IncidentForm
                    key={`incident:${child.id}`}
                    child={child}
                    userId={userId}
                    onActivity={onActivity}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Khu vực xem lại nhật ký các lượt ghi nhận gần đây trong phiên làm việc */}
      <section
        className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all p-4 sm:p-6 space-y-4"
        aria-label="Nhật ký các lượt ghi nhận gần đây trong phiên làm việc"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-subtle text-brand">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Nhật ký ghi nhận trong phiên làm việc
            </h3>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-brand-subtle px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
            {visibleRecords.length} lượt
          </span>
        </div>

        {!visibleRecords.length ? (
          <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted">
            Chưa có lượt ghi nhận nào cho trẻ trong danh sách hiện tại. Các lượt ghi nhận trong phiên sẽ xuất hiện tại đây để bạn tiện đối chiếu.
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRecords.map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 transition-all hover:border-brand-border/70 hover:shadow-2xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                        item.type === "health"
                          ? "bg-brand-subtle text-brand-text border border-brand-border/60"
                          : "bg-warning-bg text-warning border border-warning-border/60"
                      )}
                    >
                      {item.type === "health" ? "Sức khỏe nhanh" : "Sự cố"}
                    </span>
                    <span className="text-[11px] text-muted">
                      {formatRecordTime(item.timeUtc)}
                    </span>
                  </div>
                  <h4 className="wrap-anywhere text-sm font-bold text-foreground">
                    {item.childFullName}
                  </h4>
                  <p className="wrap-anywhere text-xs text-muted line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-end mt-1 pt-0.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewingRecord(item)}
                    className="h-7 px-2.5 text-xs hover:border-brand-border hover:text-brand-text"
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal xem chi tiết bản ghi */}
      <RecordDetailModal
        item={viewingRecord && visibleRecords.some((item) => item.id === viewingRecord.id) ? viewingRecord : null}
        userId={userId}
        onClose={closeRecord}
      />

      {/* Hộp thoại xác nhận hủy nội dung chưa lưu */}
      <ConfirmDialog
        isOpen={Boolean(change)}
        title="Bỏ nội dung chưa lưu?"
        compactHeader={true}
        layout="stacked"
        description="Bạn đang có nội dung nhập liệu hoặc ảnh chưa được lưu. Nếu chuyển đổi bây giờ, các thay đổi chưa lưu sẽ bị hủy."
        confirmText="Bỏ nội dung"
        cancelText="Tiếp tục chỉnh sửa"
        onClose={closeChange}
        onConfirm={() => {
          if (change) applySelection(change);
          requestAnimationFrame(() => changeTrigger.current?.focus({ preventScroll: true }));
        }}
      />
    </div>
  );
}
