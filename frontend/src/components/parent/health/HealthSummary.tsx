"use client";

import { Paged } from "@/components/parent/health/Paged";
import { ICON_PATHS, SectionCard } from "@/components/parent/health/SectionCard";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useParentHealth } from "@/hooks/useParentHealth";
import { formatTemperatureCelsius } from "@/lib/health";
import { formatMeasurementDate, formatMeasurementDateTime, formatMeasurementNumber } from "@/lib/growth-measurements";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, type HealthMood, type ParentGrowthMeasurement } from "@/types/health";

const MOOD_BADGE: Record<HealthMood, string> = {
  Happy: "border-brand-border bg-brand-subtle text-brand-text",
  Normal: "border-info-border bg-info-bg text-info-text",
  Tired: "border-warning-border bg-warning-bg text-amber-800",
  Fussy: "border-danger-border bg-danger-bg text-red-700",
};

// Viền trái theo tâm trạng để lướt danh sách là nhận ra ngày bé không khỏe.
const MOOD_ACCENT: Record<HealthMood, string> = {
  Happy: "border-l-brand",
  Normal: "border-l-info",
  Tired: "border-l-warning",
  Fussy: "border-l-danger",
};

// Giữ phân biệt null (chưa đo) và 0: chỉ null mới hiện dấu gạch.
const measure = (value: number | null, unit: string) =>
  value === null ? "—" : `${formatMeasurementNumber(value)} ${unit}`;

const growthColumns: Column<ParentGrowthMeasurement>[] = [
  {
    key: "measuredAtUtc",
    header: "Thời điểm đo",
    render: (row) => (
      <time dateTime={row.measuredAtUtc} className="tabular-nums">{formatMeasurementDateTime(row.measuredAtUtc)}</time>
    ),
  },
  { key: "heightCm", header: "Chiều cao", className: "text-right tabular-nums", render: (row) => measure(row.heightCm, "cm") },
  { key: "weightKg", header: "Cân nặng", className: "text-right tabular-nums", render: (row) => measure(row.weightKg, "kg") },
];

function LatestTile({ label, value, at }: { label: string; value: string; at?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-brand-border bg-brand-subtle px-4 py-3">
      <p className="text-xs font-medium text-brand-text">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{at ? `Đo ngày ${formatMeasurementDate(at)}` : "Chưa có số đo"}</p>
    </div>
  );
}

const ThermometerIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V4a2 2 0 10-4 0v10.76a4 4 0 104 0z" />
  </svg>
);

/** Lưu ý sức khỏe ở đầu trang + sức khỏe nhanh + số đo (FR-HEALTH-05). Chỉ đọc. */
export function HealthSummary({ childId }: { childId: string }) {
  const health = useParentHealth(childId);
  // Lỗi tạm thời giữ dữ liệu cũ; lỗi ngoài phạm vi phải ẩn toàn bộ dữ liệu đã lưu.
  const hasVisibleData = health.data !== undefined
    && health.error?.status !== 403 && health.error?.status !== 404;

  if (health.isLoading) {
    return <div role="status"><StatusMessage status="loading" title="Đang tải thông tin sức khỏe…" /></div>;
  }
  if (!hasVisibleData || !health.data) {
    return (
      <div role="alert">
        <StatusMessage
          status="error"
          title="Không thể tải thông tin sức khỏe"
          message={health.error?.message}
          onRetry={() => { void health.refetch(); }}
        />
      </div>
    );
  }

  const { healthNotes, quickHealthStatuses, growthMeasurements } = health.data;
  const noteLines = (healthNotes ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  // API sắp mới nhất trước nên số đo hợp lệ đầu tiên là số đo gần nhất của từng chỉ số.
  const latestHeight = growthMeasurements.find((row) => row.heightCm !== null);
  const latestWeight = growthMeasurements.find((row) => row.weightKg !== null);

  return (
    <div className="space-y-5" aria-busy={health.isFetching}>
      {health.isError && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice
            className="px-4 py-3 sm:px-5"
            message={health.error.message}
            isFetching={health.isFetching}
            onRetry={() => { void health.refetch(); }}
          />
        </div>
      )}

      <SectionCard
        id="health-notes-heading"
        iconPath={ICON_PATHS.heart}
        title="Lưu ý sức khỏe"
        subtitle="Thông tin do Nhân viên Y tế nhà trường cập nhật"
        className="border-l-4 border-l-brand"
      >
        <div className="p-3 sm:p-4">
          <div className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3.5">
            {noteLines.length === 0 ? (
              <p className="text-sm text-muted">Chưa có lưu ý sức khỏe nào được ghi nhận.</p>
            ) : (
              <ul className="space-y-2">
                {noteLines.map((line, index) => (
                  <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="flex items-start gap-2.5 border-t border-warning-border bg-warning-bg px-4 py-3 text-sm text-amber-800 sm:px-5">
          <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          Nếu thông tin sức khỏe của bé bị sai hoặc thiếu, phụ huynh vui lòng thông báo ngay cho Nhân viên Y tế nhà trường.
        </p>
      </SectionCard>

      {/* 1024px còn sidebar nên chỉ chia 2 cột từ xl. */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:items-start">
        <SectionCard
          id="quick-health-heading"
          iconPath={ICON_PATHS.pulse}
          tone="info"
          title="Tình trạng sức khỏe hằng ngày"
          subtitle="Tâm trạng và thân nhiệt do nhà trường ghi nhận"
          aside={quickHealthStatuses.length > 0 && `${quickHealthStatuses.length} lần ghi`}
        >
          {quickHealthStatuses.length === 0 ? (
            <div className="p-4 sm:p-5">
              <StatusMessage status="empty" title="Chưa có ghi nhận" message="Các lần theo dõi tâm trạng, thân nhiệt của bé sẽ hiện ở đây." />
            </div>
          ) : (
            <Paged items={quickHealthStatuses} pageSize={5}>
              {(rows) => (
                <ul className="space-y-3 p-3 sm:p-4">
                  {rows.map((row) => (
                    <li key={row.id} className={cn("overflow-hidden rounded-xl border border-border border-l-4 bg-card", MOOD_ACCENT[row.mood] ?? "border-l-border")}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/40 px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
                          MOOD_BADGE[row.mood] ?? "border-border bg-background text-muted",
                        )}>
                          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                          {MOOD_LABELS[row.mood] ?? "Chưa xác định"}
                        </span>
                        <time dateTime={row.recordedAtUtc} className="text-xs font-medium tabular-nums text-foreground/80">
                          {formatMeasurementDateTime(row.recordedAtUtc)}
                        </time>
                      </div>
                      <div className="space-y-2 px-4 py-3.5">
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <ThermometerIcon />
                          {formatTemperatureCelsius(row.temperatureCelsius)}
                        </p>
                        {row.notes && (
                          <p className="whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">
                            {row.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Paged>
          )}
        </SectionCard>

        <SectionCard
          id="growth-heading"
          iconPath={ICON_PATHS.ruler}
          title="Chiều cao & cân nặng"
          subtitle="Số đo phát triển của bé theo thời gian"
          aside={growthMeasurements.length > 0 && `${growthMeasurements.length} lần đo`}
        >
          {growthMeasurements.length === 0 ? (
            <div className="p-4 sm:p-5">
              <StatusMessage status="empty" title="Chưa có số đo" message="Chiều cao, cân nặng của bé sẽ hiện ở đây sau mỗi lần đo." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 p-3 sm:p-4">
                <LatestTile label="Chiều cao gần nhất" value={latestHeight ? measure(latestHeight.heightCm, "cm") : "—"} at={latestHeight?.measuredAtUtc} />
                <LatestTile label="Cân nặng gần nhất" value={latestWeight ? measure(latestWeight.weightKg, "kg") : "—"} at={latestWeight?.measuredAtUtc} />
              </div>
              <Paged items={growthMeasurements} pageSize={8}>
                {(rows) => (
                  <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                    <DataTable
                      columns={growthColumns}
                      data={rows}
                      keyExtractor={(row) => row.id}
                      className="[&_td]:px-3 [&_th]:px-3 [&_thead]:bg-brand-subtle/60 [&_tbody_tr:nth-child(even)]:bg-background/50"
                    />
                  </div>
                )}
              </Paged>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
