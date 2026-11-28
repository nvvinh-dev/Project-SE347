"use client";

import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { getAttendanceForDate, getHomeroomChildren, getVietnamDate } from "@/lib/attendance";
import { ApiError, toApiError } from "@/lib/axios";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus, type HomeroomChildResponse } from "@/types/attendance";
import { MOOD_LABELS } from "@/types/health";
import { checkInBatch } from "../attendance/_lib/batch-attendance";
import {
  createQuickHealthBatch, isMood, isUncertainWrite, MOOD_OPTIONS,
  validateNotes, validateTemperature, formatTemperatureCelsius,
} from "../incidents/_lib/health-incidents";
import { getHomeroomClasses } from "../media/_lib/activity-photos";

const MAX_BATCH = 50;
const attendanceOptions = Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

type Props = { userId: string; date?: string };
type DialogProps = Props & { onClose: () => void; onUncertain: () => void };
type Row = { status: AttendanceStatus; mood: string; temperature: string; notes: string };
type Fields = { rows: Row[] };
type Result = { childId: string; name: string; outcome: string; detail: string };

async function getClassRoster(signal?: AbortSignal) {
  const classes = await getHomeroomClasses(signal);
  const group = classes.length === 1 ? classes[0] : null;
  const children = group ? await getHomeroomChildren(signal) : [];
  if (!Array.isArray(children) || children.some((child) => !child?.id || !child.fullName) ||
    new Set(children.map((child) => child.id)).size !== children.length) {
    throw new ApiError("Danh sách trẻ không hợp lệ. Vui lòng tải lại.", null, null);
  }
  return { group, children, classCount: classes.length };
}

export function ClassBatchButton({ disabled, ...props }: Props & { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  return (
    <>
      <Button ref={trigger} size="sm" className="min-h-11 shrink-0 whitespace-nowrap"
        disabled={disabled || blocked} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        {props.date ? "Điểm danh cả lớp" : "Ghi sức khỏe nhanh cả lớp"}
      </Button>
      {open && createPortal(<ClassBatchRoster {...props} onClose={close} onUncertain={() => setBlocked(true)} />, document.body)}
    </>
  );
}

function ClassBatchRoster({ userId, date, onClose, onUncertain }: DialogProps) {
  const roster = useApiQuery({
    queryKey: ["teacher-batch-roster", userId],
    queryFn: ({ signal }) => getClassRoster(signal),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { group, children = [], classCount = 0 } = roster.data ?? {};
  if (!group || !children.length || children.length > MAX_BATCH) {
    const message = classCount > 1
      ? "Chưa thể lưu theo lớp khi bạn phụ trách nhiều lớp vì danh sách trẻ chưa được tách theo lớp."
      : group ? "Lớp chưa có trẻ." : "Bạn chưa được phân công lớp.";
    const content = roster.isPending ? <StatusMessage status="loading" title="Đang tải danh sách lớp" />
      : roster.isError ? <StatusMessage status="error" message={roster.error.message} onRetry={() => void roster.refetch()} />
      : children.length > MAX_BATCH ? <StatusMessage status="error" message="Lớp có hơn 50 trẻ. Hệ thống chưa hỗ trợ lưu cả lớp trong một lần." />
      : <StatusMessage status="empty" message={message} />;
    return <ConfirmDialog isOpen title={date ? "Xác nhận điểm danh cả lớp" : "Ghi sức khỏe nhanh cả lớp"}
      layout="stacked" compactHeader description={content} confirmText="Đóng" cancelText="Hủy"
      onClose={onClose} onConfirm={onClose} />;
  }
  return <ClassBatchForm key={[date, group.id, ...children.map((child) => child.id)].join(":")}
    userId={userId} date={date} className={group.name} classId={group.id} students={children}
    refreshRoster={roster.refetch} onClose={onClose} onUncertain={onUncertain} />;
}

function ClassBatchForm({
  userId, date, className, classId, students: children, refreshRoster, onClose, onUncertain,
}: DialogProps & {
  className: string;
  classId: string;
  students: HomeroomChildResponse[];
  refreshRoster: () => Promise<{ data?: Awaited<ReturnType<typeof getClassRoster>>; isError: boolean; error: ApiError | null }>;
}) {
  const id = useId();
  const client = useQueryClient();
  const todayKey = ["teacher-attendance", userId, date];
  const today = useApiQuery({
    queryKey: todayKey,
    queryFn: ({ signal }) => getAttendanceForDate(date!, signal),
    enabled: Boolean(date),
    retry: false,
  });
  const records = new Map(today.data?.map((record) => [record.childId, record]));
  const form = useForm<Fields>({
    defaultValues: { rows: children.map(() => ({ status: "Present", mood: "", temperature: "", notes: "" })) },
  });
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [working, setWorking] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const notice = useRef<HTMLDivElement>(null);
  const focusNotice = () => requestAnimationFrame(() => notice.current?.focus());
  const mutation = useApiMutation<Result[], Fields>({
    retry: false,
    mutationFn: async ({ rows }) => {
      if (date) {
        const saved = await checkInBatch(children.map((child, index) => ({
          childId: child.id,
          status: records.get(child.id)?.status ?? rows[index].status,
        })));
        return saved.map(({ childId, attendance, alreadyCheckedIn }) => ({
          childId, name: attendance.childFullName,
          outcome: alreadyCheckedIn ? "Bỏ qua — đã điểm danh" : "Đã lưu",
          detail: ATTENDANCE_STATUS_LABELS[attendance.status],
        }));
      }
      const saved = await createQuickHealthBatch(children.map((child, index) => {
        const { mood, notes, temperature } = rows[index];
        if (!isMood(mood)) throw new ApiError("Vui lòng chọn tâm trạng.", null, 400);
        return { childId: child.id, mood, notes: notes.trim(), temperatureCelsius: temperature.trim() ? Number(temperature) : null };
      }));
      return saved.map((record) => ({
        childId: record.childId, name: record.childFullName, outcome: "Đã lưu",
        detail: record.temperatureCelsius === null ? MOOD_LABELS[record.mood]
          : `${MOOD_LABELS[record.mood]} · ${formatTemperatureCelsius(record.temperatureCelsius)}`,
      }));
    },
  });

  async function submit(values: Fields) {
    if (lock.current || uncertain || needsRefresh || results.length) return;
    lock.current = true;
    setWorking(true);
    setError(null);
    form.clearErrors();
    let sent = false;
    try {
      const latest = await refreshRoster();
      if (latest.isError) throw latest.error;
      if (latest.data?.group?.id !== classId || latest.data.children.length !== children.length ||
        latest.data.children.some((child, index) => child.id !== children[index].id)) {
        throw new ApiError("Danh sách lớp vừa thay đổi. Vui lòng kiểm tra lại trước khi lưu.", null, 409);
      }
      if (date && getVietnamDate() !== date) {
        throw new ApiError("Đã sang ngày mới. Vui lòng tải lại màn hình điểm danh.", null, 400);
      }
      sent = true;
      setResults(await mutation.mutateAsync(values));
      if (date) {
        void client.invalidateQueries({ queryKey: ["teacher-attendance", userId] });
        void client.invalidateQueries({ queryKey: ["teacher-attendance-history", userId] });
      }
    } catch (failure) {
      const problem = toApiError(failure);
      setError(problem);
      if (sent && problem.status === 400) {
        for (const message of problem.errors ?? []) {
          const match = /^items\[(\d+)\]\.(status|mood|temperatureCelsius|notes):\s*(.+)$/.exec(message);
          if (!match || Number(match[1]) >= children.length) continue;
          const field = match[2] === "temperatureCelsius" ? "temperature" : match[2] as "status" | "mood" | "notes";
          form.setError(`rows.${Number(match[1])}.${field}`, { type: "server", message: match[3] });
        }
      }
      if (sent && date && (problem.status === 409 || isUncertainWrite(problem))) {
        setNeedsRefresh((await today.refetch()).isError);
      }
      if (sent && !date && isUncertainWrite(problem)) {
        setUncertain(true);
        onUncertain();
      }
      if (sent && problem.status === 404) await refreshRoster();
    } finally {
      lock.current = false;
      setWorking(false);
      focusNotice();
    }
  }

  const columns: Column<HomeroomChildResponse>[] = [{
    key: "fullName",
    header: date ? "Trẻ và trạng thái điểm danh" : "Trẻ và thông tin sức khỏe nhanh",
    className: "whitespace-normal",
    render: (child, index) => {
      const row = form.formState.errors.rows?.[index];
      const fieldId = `${id}-${index}`;
      const existing = records.get(child.id);
      return (
        <div className="min-w-0 space-y-2">
          <p className="break-words font-semibold">{child.fullName}</p>
          {date ? (existing ? (
            <p className="text-muted">Đã điểm danh · {ATTENDANCE_STATUS_LABELS[existing.status]}</p>
          ) : (
            <FormField id={`${fieldId}-status`} error={row?.status?.message} className="max-w-xs">
              <Select id={`${fieldId}-status`} options={attendanceOptions} error={row?.status?.message}
                aria-label={`Điểm danh cho ${child.fullName}`} className="min-h-11"
                {...form.register(`rows.${index}.status`)} />
            </FormField>
          )) : (
            <div className="@container min-w-0">
            <div className="grid min-w-0 gap-2 @[260px]:grid-cols-[minmax(8.5rem,2fr)_minmax(0,3fr)]">
              <div className="min-w-0 space-y-2">
              <FormField id={`${fieldId}-mood`} label="Tâm trạng" required error={row?.mood?.message}>
                <Select id={`${fieldId}-mood`} aria-label={`Tâm trạng của ${child.fullName}`}
                  options={[...MOOD_OPTIONS]} placeholder="Chọn tâm trạng" className="min-h-11" error={row?.mood?.message}
                  {...form.register(`rows.${index}.mood`, { validate: (value) => isMood(value) || "Vui lòng chọn tâm trạng." })} />
              </FormField>
              <FormField id={`${fieldId}-temperature`} label="Nhiệt độ (°C)" error={row?.temperature?.message}>
                <Input id={`${fieldId}-temperature`} aria-label={`Nhiệt độ của ${child.fullName}`} className="min-h-11"
                  type="number" min={30} max={45} step={0.1} error={row?.temperature?.message}
                  {...form.register(`rows.${index}.temperature`, { validate: validateTemperature })} />
              </FormField>
              </div>
              <FormField id={`${fieldId}-notes`} label="Ghi chú" required error={row?.notes?.message}
                className="grid min-w-0 grid-rows-[auto_1fr_auto]">
                <Textarea id={`${fieldId}-notes`} aria-label={`Ghi chú cho ${child.fullName}`} rows={2}
                  className="block h-full min-h-20 resize-none" error={row?.notes?.message}
                  {...form.register(`rows.${index}.notes`, { validate: validateNotes })} />
              </FormField>
            </div>
            </div>
          )}
        </div>
      );
    },
  }];

  const loading = Boolean(date && today.isPending);
  const unavailable = Boolean(date && (today.isError || needsRefresh));
  const done = results.length > 0 || uncertain;
  const content = (
    <div className="max-h-[calc(100dvh-15rem)] min-h-20 min-w-0 space-y-3 overflow-y-auto">
      <h2 className="break-words text-base font-semibold text-foreground">{className} · {children.length} trẻ</h2>
      {!results.length && date && !loading && !unavailable && <p>Trẻ chưa điểm danh được chọn sẵn Có mặt. Hãy đổi trạng thái của trẻ vắng trước khi xác nhận.</p>}
      <div ref={notice} tabIndex={-1} className="space-y-2">
        {error && <div role="alert" className="space-y-1 rounded-lg bg-danger-bg p-3 text-sm text-danger">
          <p>{error.message}</p>
          {!!error.errors?.length && <ul className="list-inside list-disc">
            {error.errors.map((message, index) => {
              const match = /^items\[(\d+)\](?:\.\w+)?:\s*(.+)$/.exec(message);
              const child = match && children[Number(match[1])];
              return <li key={index}>{child && match ? `${child.fullName}: ${match[2]}` : message}</li>;
            })}
          </ul>}
          {uncertain && <p>Hãy đối chiếu bản ghi đã lưu trước khi ghi lại để tránh trùng.</p>}
        </div>}
        {results.length > 0 && <p role="status" className="rounded-lg bg-success-bg p-3 text-sm text-success">Đã nhận kết quả cho {results.length} trẻ.</p>}
      </div>
      {unavailable && <StatusMessage status="error"
        message={today.error?.message ?? "Vui lòng tải lại điểm danh hôm nay."}
        onRetry={() => void today.refetch().then((response) => setNeedsRefresh(response.isError))} />}
      {loading ? <StatusMessage status="loading" title="Đang tải điểm danh hôm nay" /> : results.length > 0 ? (
        <DataTable data={results} keyExtractor={(row) => row.childId} columns={[{
          key: "name", header: "Kết quả từng trẻ", className: "whitespace-normal",
          render: (row) => <div className="break-words"><p className="font-semibold">{row.name}</p><p>{row.outcome} · {row.detail}</p></div>,
        }]} />
      ) : !unavailable && (
        <form noValidate onSubmit={(event) => event.preventDefault()}>
          <fieldset disabled={working || uncertain} className="min-w-0 space-y-3">
            <DataTable columns={columns} data={children} keyExtractor={(child) => child.id} />
          </fieldset>
        </form>
      )}
    </div>
  );
  return <ConfirmDialog isOpen title={date ? "Xác nhận điểm danh cả lớp" : "Ghi sức khỏe nhanh cả lớp"}
    description={content} layout="stacked" compactHeader isLoading={working}
    confirmText={done || unavailable || loading ? "Đóng" : date ? "Xác nhận lưu" : "Lưu"}
    onClose={() => { if (!lock.current) onClose(); }}
    onConfirm={() => {
      if (lock.current) return;
      if (done || unavailable || loading) onClose();
      else void form.handleSubmit(submit)();
    }} />;
}
