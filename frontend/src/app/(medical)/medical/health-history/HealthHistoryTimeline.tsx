"use client";

import React, { useMemo, useState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  formatMeasurementDateTime,
  formatMeasurementNumber,
} from "@/lib/growth-measurements";
import { IncidentPhotosSection } from "./IncidentPhotosSection";
import { ALL_HISTORY_TYPES, HistoryFilterDropdown, type HistoryRecordType } from "./HistoryFilterDropdown";
import {
  getMoodLabel,
  type HealthHistoryItem,
  type IncidentHistoryItem,
  type QuickHealthStatusHistoryItem,
  type GrowthMeasurementHistoryItem,
} from "./_lib/types";

function formatHistoryDateTime(value: string): string {
  return formatMeasurementDateTime(value).replace(" ", " - ");
}

interface HealthHistoryTimelineProps {
  childId: string;
  childFullName: string;
  items: HealthHistoryItem[];
}

const HISTORY_ACCENTS: Record<HealthHistoryItem["type"], string> = {
  Incident: "border-l-warning",
  QuickHealthStatus: "border-l-brand",
  GrowthMeasurement: "border-l-info",
};

const DOT_COLORS: Record<HealthHistoryItem["type"], string> = {
  Incident: "bg-warning",
  QuickHealthStatus: "bg-brand",
  GrowthMeasurement: "bg-info",
};

export function HealthHistoryTimeline({
  childId,
  childFullName,
  items,
}: HealthHistoryTimelineProps) {
  // Quản lý trạng thái mở xem ảnh theo từng sự cố
  const [openIncidentIds, setOpenIncidentIds] = useState<Record<string, boolean>>({});

  const toggleIncidentPhotos = (incidentId: string) => {
    setOpenIncidentIds((prev) => ({
      ...prev,
      [incidentId]: !prev[incidentId],
    }));
  };

  const [filterSelection, setFilterSelection] = useState<{
    childId: string;
    types: HistoryRecordType[];
  }>({ childId, types: ALL_HISTORY_TYPES });

  // Đổi trẻ luôn trở về đủ loại bản ghi, kể cả khi quay lại trẻ đã xem.
  if (filterSelection.childId !== childId) {
    setFilterSelection({ childId, types: ALL_HISTORY_TYPES });
  }

  const selectedTypes = filterSelection.childId === childId
    ? filterSelection.types
    : ALL_HISTORY_TYPES;

  const { counts, visibleItems } = useMemo(() => {
    const counts: Record<HistoryRecordType, number> = {
      Incident: 0,
      QuickHealthStatus: 0,
      GrowthMeasurement: 0,
    };
    for (const item of items) {
      counts[item.type] += 1;
    }
    return {
      counts,
      visibleItems:
        selectedTypes.length === ALL_HISTORY_TYPES.length
          ? items
          : items.filter((item) => selectedTypes.includes(item.type)),
    };
  }, [items, selectedTypes]);

  const selectHistoryFilters = (types: HistoryRecordType[]) => {
    setFilterSelection({ childId, types });
  };

  return (
    <section className="min-w-0 space-y-2" aria-labelledby="health-history-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="health-history-heading" className="min-w-0 text-sm font-semibold text-foreground">
          Lịch sử sức khỏe & Sự cố ({items.length} bản ghi)
        </h3>
        <HistoryFilterDropdown key={childId} counts={counts} onChange={selectHistoryFilters} />
      </div>

      <div id="health-history-records" className="min-w-0">
        {items.length === 0 ? (
          <StatusMessage
            status="empty"
            title="Chưa có bản ghi sức khỏe hoặc sự cố"
            message="Trẻ này hiện chưa có sự cố, bản ghi sức khỏe nhanh hay số đo phát triển nào được ghi nhận."
            className="p-4"
          />
        ) : visibleItems.length === 0 ? (
          <StatusMessage
            status="empty"
            title={selectedTypes.length === 0 ? "Chưa chọn loại bản ghi" : "Chưa có bản ghi thuộc phân loại này"}
            message="Mở Bộ lọc và chọn loại bản ghi cần xem hoặc chọn Tất cả."
            className="p-4"
          />
        ) : null}

        {/* Ẩn thay vì gỡ bản ghi để chuyển bộ lọc không reset ảnh hoặc truy vấn lại. */}
        <ol className="min-w-0 pt-2" hidden={visibleItems.length === 0}>
          {items.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              hidden={!selectedTypes.includes(item.type)}
              className="relative min-w-0 pb-3 pl-6 sm:pl-7"
            >
              <div
                aria-hidden="true"
                hidden={visibleItems.length < 2 || visibleItems[visibleItems.length - 1] === item}
                className="absolute bottom-0 left-2 top-0 w-px -translate-x-1/2 bg-border/80"
              />
              <div aria-hidden="true" className={`absolute left-2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-card ${DOT_COLORS[item.type]}`} />

              <div className={`min-w-0 rounded-xl border border-border/80 border-l-4 bg-card px-4 py-3 shadow-sm sm:px-5 ${HISTORY_ACCENTS[item.type]}`}>
                {item.type === "Incident" && (
                  <IncidentCard
                    item={item}
                    childId={childId}
                    childFullName={childFullName}
                    isOpen={Boolean(openIncidentIds[item.id])}
                    onToggle={() => toggleIncidentPhotos(item.id)}
                  />
                )}

                {item.type === "QuickHealthStatus" && (
                  <QuickHealthStatusCard item={item} />
                )}

                {item.type === "GrowthMeasurement" && (
                  <GrowthMeasurementCard item={item} />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function IncidentCard({
  item,
  childId,
  childFullName,
  isOpen,
  onToggle,
}: {
  item: IncidentHistoryItem;
  childId: string;
  childFullName: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border/40 pb-1.5">
        <span className="inline-flex items-center rounded-lg border border-warning-border bg-warning-bg px-2.5 py-0.5 text-xs font-semibold text-warning">
          Sự cố
        </span>
        <time
          dateTime={item.occurredAtUtc}
          className="text-xs font-medium text-muted tabular-nums"
        >
          {formatHistoryDateTime(item.occurredAtUtc)}
        </time>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Mô tả sự cố:</p>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
          {item.description}
        </p>
      </div>

      <IncidentPhotosSection
        childId={childId}
        childFullName={childFullName}
        incidentId={item.id}
        photoCount={item.photoCount}
        isOpen={isOpen}
        onToggle={onToggle}
      />
    </div>
  );
}

function QuickHealthStatusCard({ item }: { item: QuickHealthStatusHistoryItem }) {
  const temperatureDisplay =
    item.temperatureCelsius !== null
      ? `${formatMeasurementNumber(item.temperatureCelsius)} °C`
      : "Chưa ghi nhận";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border/40 pb-2">
        <span className="inline-flex items-center rounded-lg border border-brand-border bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand-text">
          Sức khỏe nhanh
        </span>
        <time
          dateTime={item.occurredAtUtc}
          className="text-xs font-medium text-muted tabular-nums"
        >
          {formatHistoryDateTime(item.occurredAtUtc)}
        </time>
      </div>

      <dl className="grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-8">
        <div className="flex min-w-0 items-baseline gap-x-2">
          <dt className="shrink-0 text-sm font-semibold text-foreground">Tâm trạng:</dt>
          <dd className="min-w-0 text-sm font-normal text-foreground [overflow-wrap:anywhere]">
            {getMoodLabel(item.mood)}
          </dd>
        </div>

        <div className="flex min-w-0 items-baseline gap-x-2">
          <dt className="shrink-0 text-sm font-semibold text-foreground">Thân nhiệt:</dt>
          <dd className={`min-w-0 text-sm font-normal tabular-nums ${item.temperatureCelsius === null ? "text-muted-light italic" : "text-foreground"}`}>
            {temperatureDisplay}
          </dd>
        </div>
      </dl>

      <div className="mt-2 min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">Ghi chú theo dõi:</p>
        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
          {item.notes}
        </p>
      </div>
    </div>
  );
}

function GrowthMeasurementCard({ item }: { item: GrowthMeasurementHistoryItem }) {
  const heightDisplay =
    item.heightCm !== null
      ? `${formatMeasurementNumber(item.heightCm)} cm`
      : "Chưa ghi nhận";

  const weightDisplay =
    item.weightKg !== null
      ? `${formatMeasurementNumber(item.weightKg)} kg`
      : "Chưa ghi nhận";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border/40 pb-2">
        <span className="inline-flex items-center rounded-lg border border-info-border bg-info-bg px-2.5 py-0.5 text-xs font-semibold text-info-text">
          Số đo phát triển
        </span>
        <time
          dateTime={item.occurredAtUtc}
          className="text-xs font-medium text-muted tabular-nums"
        >
          {formatHistoryDateTime(item.occurredAtUtc)}
        </time>
      </div>

      <dl className="grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-8">
        <div className="flex min-w-0 items-baseline gap-x-2">
          <dt className="shrink-0 text-sm font-semibold text-foreground">Chiều cao:</dt>
          <dd className={`min-w-0 text-sm font-normal tabular-nums ${item.heightCm === null ? "text-muted-light italic" : "text-foreground"}`}>
            {heightDisplay}
          </dd>
        </div>

        <div className="flex min-w-0 items-baseline gap-x-2">
          <dt className="shrink-0 text-sm font-semibold text-foreground">Cân nặng:</dt>
          <dd className={`min-w-0 text-sm font-normal tabular-nums ${item.weightKg === null ? "text-muted-light italic" : "text-foreground"}`}>
            {weightDisplay}
          </dd>
        </div>
      </dl>
    </div>
  );
}
