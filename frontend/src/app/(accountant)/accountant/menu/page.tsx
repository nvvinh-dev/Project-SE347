"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { WeeklyMenuForm } from "@/components/accountant/menu/WeeklyMenuForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useCreateWeeklyMenu, useUpdateWeeklyMenu, useWeeklyMenu } from "@/hooks/useWeeklyMenu";
import { currentMenuWeek, formatMenuDate, getWeekStart, shiftMenuDate } from "@/lib/menu";
import type { MenuEntry } from "@/types/menu";

function WeekEditor({ week, onDirtyChange, onBusyChange }: {
  week: string; onDirtyChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void;
}) {
  const query = useWeeklyMenu(week);
  const createMenu = useCreateWeeklyMenu();
  const updateMenu = useUpdateWeeklyMenu();
  const isBusy = createMenu.isPending || updateMenu.isPending;
  const hasData = query.data !== undefined && query.error?.status !== 403;

  async function save(entries: MenuEntry[]) {
    onBusyChange(true);
    try {
      return await (query.data
        ? updateMenu.mutateAsync({ id: query.data.id, weekStartDate: week, data: { entries } })
        : createMenu.mutateAsync({ weekStartDate: week, entries }));
    } finally { onBusyChange(false); }
  }

  if (query.isLoading) return <div role="status"><StatusMessage status="loading" title="Đang tải thực đơn tuần…" /></div>;
  if (query.isError && !hasData) return <div role="alert"><StatusMessage status="error" title="Không thể tải thực đơn tuần" message={query.error.message} onRetry={() => { void query.refetch(); }} /></div>;
  if (query.data === undefined) return null;

  return (
    <div className="space-y-5">
      {query.isError && hasData && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm">
        <p className="min-w-0 flex-1"><strong className="font-medium">Chưa thể làm mới thực đơn.</strong> {query.error.message} Nội dung đang nhập được giữ lại.</p>
        <Button variant="secondary" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Thử lại</Button>
      </div>}
      <WeeklyMenuForm week={week} menu={query.data} isBusy={isBusy} onDirtyChange={onDirtyChange} onSave={save} />
    </div>
  );
}

export default function AccountantMenuPage() {
  const [week, setWeek] = useState(currentMenuWeek);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingWeek, setPendingWeek] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const editingDateByKeyboard = useRef(false);
  const { register, setValue } = useForm<{ date: string }>({ defaultValues: { date: week } });

  function applyWeek(value: string) {
    editingDateByKeyboard.current = false;
    setWeek(value);
    setValue("date", value);
    setDirty(false);
    setPendingWeek(null);
  }

  function selectWeek(value: string) {
    const nextWeek = getWeekStart(value);
    if (!nextWeek || nextWeek === week || busy) {
      setValue("date", week);
      return;
    }
    if (dirty) setPendingWeek(nextWeek);
    else applyWeek(nextWeek);
  }

  const dateField = register("date");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Thực đơn tuần" description="Thực đơn chung của nhà trường" />
      <section aria-label="Chọn tuần thực đơn" className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0 sm:w-56">
            <FormField id="menu-week" label="Chọn ngày trong tuần">
              <Input {...dateField} ref={(element) => { dateField.ref(element); dateRef.current = element; }} id="menu-week" type="date" disabled={busy}
                onChange={(event) => {
                  const chosen = event.target.value;
                  void dateField.onChange(event);
                  // Gõ từng phần của ngày chỉ sửa bản nháp; chọn bằng lịch áp dụng ngay.
                  if (!editingDateByKeyboard.current) selectWeek(chosen);
                }}
                onPointerDown={() => { editingDateByKeyboard.current = false; }}
                onBlur={(event) => {
                  void dateField.onBlur(event);
                  if (editingDateByKeyboard.current) {
                    editingDateByKeyboard.current = false;
                    selectWeek(event.currentTarget.value);
                  }
                }}
                className="min-w-0" onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    editingDateByKeyboard.current = false;
                    selectWeek(event.currentTarget.value);
                  } else if (event.key === "Escape") {
                    editingDateByKeyboard.current = false;
                    setValue("date", week);
                  } else if (event.key !== "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    editingDateByKeyboard.current = true;
                  }
                }} />
            </FormField>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button variant="secondary" disabled={busy} aria-label="Tuần trước" title="Tuần trước" onClick={() => selectWeek(shiftMenuDate(week, -7))}><span aria-hidden="true">←</span><span className="hidden sm:inline">Tuần trước</span></Button>
            <Button variant="secondary" disabled={busy} className="flex-1 sm:flex-none" onClick={() => selectWeek(currentMenuWeek())}>Tuần này</Button>
            <Button variant="secondary" disabled={busy} aria-label="Tuần sau" title="Tuần sau" onClick={() => selectWeek(shiftMenuDate(week, 7))}><span className="hidden sm:inline">Tuần sau</span><span aria-hidden="true">→</span></Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4">
          <span className="text-sm font-semibold text-brand-text">{formatMenuDate(week)} – {formatMenuDate(shiftMenuDate(week, 6))}</span>
          <span className="text-xs text-muted">Thứ Hai – Chủ nhật</span>
        </div>
      </section>
      <WeekEditor key={week} week={week} onDirtyChange={setDirty} onBusyChange={setBusy} />
      <ConfirmDialog isOpen={pendingWeek !== null} title="Đổi tuần khi chưa lưu?" description="Tuần hiện tại có nội dung chưa lưu. Nếu đổi tuần, phần thay đổi này sẽ bị bỏ."
        confirmText="Đổi tuần" cancelText="Tiếp tục nhập"
        onClose={() => { setPendingWeek(null); setValue("date", week); dateRef.current?.focus(); }}
        onConfirm={() => { if (pendingWeek) applyWeek(pendingWeek); dateRef.current?.focus(); }} />
    </div>
  );
}
