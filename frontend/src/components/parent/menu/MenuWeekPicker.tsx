"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { currentMenuWeek, formatMenuDate, getWeekStart, shiftMenuDate } from "@/lib/menu";

interface MenuWeekPickerProps {
  week: string;
  onWeekChange: (week: string) => void;
}

export function MenuWeekPicker({ week, onWeekChange }: MenuWeekPickerProps) {
  const editingByKeyboard = useRef(false);
  const { register, setValue } = useForm<{ date: string }>({ defaultValues: { date: week } });
  const dateField = register("date");

  function selectWeek(date: string) {
    const monday = getWeekStart(date) ?? week;
    editingByKeyboard.current = false;
    setValue("date", monday);
    if (monday !== week) onWeekChange(monday);
  }

  return (
    <section aria-label="Chọn tuần thực đơn" className="rounded-2xl border border-brand-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 sm:w-56">
          <FormField id="parent-menu-week" label="Chọn ngày trong tuần">
            <Input {...dateField} id="parent-menu-week" type="date" className="min-w-0"
              onChange={(event) => {
                void dateField.onChange(event);
                // Gõ từng phần không đổi tuần; chọn bằng lịch được áp dụng ngay.
                if (!editingByKeyboard.current) selectWeek(event.currentTarget.value);
              }}
              onPointerDown={() => { editingByKeyboard.current = false; }}
              onBlur={(event) => {
                void dateField.onBlur(event);
                // Luôn áp dụng, kể cả khi người dùng bấm lại vào chính ô ngày.
                selectWeek(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  selectWeek(event.currentTarget.value);
                } else if (event.key === "Escape") {
                  editingByKeyboard.current = false;
                  setValue("date", week);
                } else if (event.key !== "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
                  editingByKeyboard.current = true;
                }
              }} />
          </FormField>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button variant="secondary" aria-label="Tuần trước" title="Tuần trước" onClick={() => selectWeek(shiftMenuDate(week, -7))}>
            <span aria-hidden="true">←</span><span className="hidden sm:inline">Tuần trước</span>
          </Button>
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => selectWeek(currentMenuWeek())}>Tuần này</Button>
          <Button variant="secondary" aria-label="Tuần sau" title="Tuần sau" onClick={() => selectWeek(shiftMenuDate(week, 7))}>
            <span className="hidden sm:inline">Tuần sau</span><span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-brand-border bg-brand-subtle px-3 py-4 sm:px-5">
        <div role="group" aria-label="Khoảng ngày của tuần đang xem" className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center sm:gap-6">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-brand-text">Thứ Hai</p>
            <time dateTime={week} className="text-base font-semibold tracking-tight tabular-nums text-brand-text sm:text-xl">{formatMenuDate(week)}</time>
          </div>
          <span aria-hidden="true" className="text-xl text-brand-text/60">→</span>
          <span className="sr-only">đến</span>
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-brand-text">Chủ nhật</p>
            <time dateTime={shiftMenuDate(week, 6)} className="text-base font-semibold tracking-tight tabular-nums text-brand-text sm:text-xl">{formatMenuDate(shiftMenuDate(week, 6))}</time>
          </div>
        </div>
      </div>
    </section>
  );
}
