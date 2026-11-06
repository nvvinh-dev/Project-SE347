"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useSchoolChildren } from "@/hooks/useSchoolChildren";
import { formatDateOfBirth } from "@/lib/growth-measurements";
import { HealthHistoryTimeline } from "./HealthHistoryTimeline";
import { useHealthHistory } from "./_lib/useHealthHistory";

interface ChildSelectorFormValues {
  childId: string;
}

export function HealthHistoryScreen() {
  const {
    data: children,
    isLoading: isChildrenLoading,
    isError: isChildrenError,
    error: childrenError,
    refetch: refetchChildren,
  } = useSchoolChildren();

  const { control, register } = useForm<ChildSelectorFormValues>({
    defaultValues: { childId: "" },
  });

  const rawChildId = useWatch({ control, name: "childId" });
  const selectedChildId = rawChildId || null;
  const selectorRef = useRef<HTMLSelectElement | null>(null);
  const [showFullChildLabel, setShowFullChildLabel] = useState(false);
  const { ref: registerChildRef, ...childField } = register("childId");

  // Lịch sử chỉ được truy vấn khi đã chọn trẻ hợp lệ
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useHealthHistory(selectedChildId);

  // Tạo danh sách lựa chọn trẻ kèm ngày sinh để phân biệt
  const childOptions = useMemo(() => {
    if (!children) return [];
    return children.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${formatDateOfBirth(c.dateOfBirth)})`,
    }));
  }, [children]);

  const selectedChildLabel = childOptions.find((option) => option.value === selectedChildId)?.label;

  // Select một dòng cần nhãn bổ sung khi tên và ngày sinh không vừa chiều rộng hiện tại.
  useEffect(() => {
    const select = selectorRef.current;
    if (!select || !selectedChildLabel) return;
    const context = document.createElement("canvas").getContext("2d");
    let active = true;
    const measureLabel = () => {
      if (!active) return;
      const style = window.getComputedStyle(select);
      const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (!context) {
        setShowFullChildLabel(true);
        return;
      }
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const letterSpacing = parseFloat(style.letterSpacing) || 0;
      const textWidth = context.measureText(selectedChildLabel).width
        + letterSpacing * Math.max(0, selectedChildLabel.length - 1);
      setShowFullChildLabel(textWidth > available);
    };
    const observer = new ResizeObserver(measureLabel);
    observer.observe(select);
    void document.fonts.ready.then(measureLabel);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [selectedChildLabel]);

  // Thông tin hồ sơ hiển thị: ưu tiên hồ sơ tươi mới nhất từ response của lịch sử
  const selectedChildFromList = useMemo(() => {
    if (!children || !selectedChildId) return null;
    return children.find((c) => c.id === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  const activeChild = historyData?.child ?? selectedChildFromList;
  const hasHealthNotes = Boolean(activeChild?.healthNotes?.trim());

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-4">
      <PageHeader
        title="Lịch sử sức khỏe / Sự cố"
        description="Xem lại lịch sử sự cố và các bản ghi sức khỏe của trẻ"
      />

      <div className="min-w-0 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm sm:px-5">
        {isChildrenError ? (
          <StatusMessage
            status="error"
            title="Không thể tải danh sách trẻ"
            message={childrenError?.message}
            onRetry={() => refetchChildren()}
          />
        ) : (
          <form className="w-full min-w-0">
            <FormField
              id="select-child"
              label="Chọn trẻ để xem lịch sử"
              hint={isChildrenLoading ? "Đang tải..." : `Tổng số: ${children?.length ?? 0} trẻ`}
            >
              <Select
                id="select-child"
                disabled={isChildrenLoading || !children || children.length === 0}
                placeholder="-- Chọn một trẻ toàn trường --"
                options={childOptions}
                title={selectedChildLabel}
                aria-describedby={showFullChildLabel && selectedChildLabel ? "selected-child-full-label" : undefined}
                {...childField}
                ref={(element) => {
                  registerChildRef(element);
                  selectorRef.current = element;
                }}
              />
            </FormField>
            {showFullChildLabel && selectedChildLabel && (
              <p id="selected-child-full-label" className="mt-1.5 break-words text-xs font-normal text-muted [overflow-wrap:anywhere]">
                {selectedChildLabel}
              </p>
            )}
          </form>
        )}
      </div>

      {selectedChildId && activeChild && (
        <section
          className={`flex min-w-0 rounded-xl border px-4 shadow-xs ${hasHealthNotes
            ? "items-start gap-3 border-warning-border bg-warning-bg/90 py-3"
            : "items-center gap-2.5 border-success-border bg-success-bg/70 py-2.5"}`}
          aria-labelledby="child-health-notes-heading"
        >
          {hasHealthNotes ? (
            <>
              <span className="mt-0.5 flex shrink-0 items-center justify-center rounded-lg bg-warning/10 p-1.5 text-warning" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="child-health-notes-heading" className="text-sm font-semibold text-foreground">
                  Lưu ý sức khỏe
                </h2>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                  {activeChild.healthNotes}
                </p>
              </div>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 2.5 2.5L16 9" />
              </svg>
              <div className="min-w-0 text-sm text-brand-text [overflow-wrap:anywhere]">
                <h2 id="child-health-notes-heading" className="inline font-semibold">Lưu ý sức khỏe:</h2>{" "}
                <span className="font-normal">Không có lưu ý sức khỏe đặc biệt</span>
              </div>
            </>
          )}
        </section>
      )}

      {!selectedChildId && !isChildrenError && (
        isChildrenLoading ? (
          <StatusMessage status="loading" title="Đang tải danh sách trẻ..." message="Vui lòng chờ trong giây lát." />
        ) : children?.length === 0 ? (
          <StatusMessage
            status="empty"
            title="Danh sách chưa có trẻ"
            message="Danh sách trẻ sẽ hiển thị tại đây khi có dữ liệu."
          />
        ) : (
          <StatusMessage
            status="empty"
            title="Chưa chọn trẻ"
            message="Vui lòng chọn một trẻ từ danh sách phía trên để xem lịch sử sức khỏe và sự cố."
          />
        )
      )}

      {selectedChildId && activeChild && (
        <div className="min-w-0">
          {isHistoryLoading && (
            <StatusMessage
              status="loading"
              title="Đang tải lịch sử sức khỏe & sự cố..."
              message="Vui lòng chờ trong giây lát."
            />
          )}

          {isHistoryError && (
            <StatusMessage
              status="error"
              title="Không thể tải lịch sử sức khỏe"
              message={historyError?.message}
              onRetry={() => refetchHistory()}
            />
          )}

          {!isHistoryLoading && !isHistoryError && historyData && (
            <HealthHistoryTimeline
              key={selectedChildId}
              childId={selectedChildId}
              childFullName={activeChild.fullName}
              items={historyData.items}
            />
          )}
        </div>
      )}
    </div>
  );
}
