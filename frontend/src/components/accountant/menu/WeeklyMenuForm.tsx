"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { toApiError } from "@/lib/axios";
import {
  formatMenuDate, MENU_DAYS, MENU_MEALS, parseMenuMeals, serializeMenuMeals, shiftMenuDate,
  type MenuMealValues,
} from "@/lib/menu";
import { cn } from "@/lib/utils";
import type { MenuEntry, WeeklyMenuResponse } from "@/types/menu";

interface MenuFormValues {
  days: (MenuMealValues & { enabled: boolean })[];
}

function valuesFor(menu: WeeklyMenuResponse | null): MenuFormValues {
  return { days: MENU_DAYS.map((day) => {
    const entry = menu?.entries.find((item) => item.dayOfWeek === day.value);
    return { enabled: !!entry, ...parseMenuMeals(entry?.description ?? "") };
  }) };
}

function entriesFor(days: MenuFormValues["days"]): MenuEntry[] {
  return days.flatMap((day, index) => day.enabled
    ? [{ dayOfWeek: MENU_DAYS[index].value, description: serializeMenuMeals(day) }]
    : []);
}

interface WeeklyMenuFormProps {
  week: string;
  menu: WeeklyMenuResponse | null;
  isBusy: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (entries: MenuEntry[]) => Promise<WeeklyMenuResponse>;
}

export function WeeklyMenuForm({ week, menu, isBusy, onDirtyChange, onSave }: WeeklyMenuFormProps) {
  const { register, control, handleSubmit, reset, clearErrors, setError, setFocus, setValue,
    formState: { errors, isDirty, defaultValues },
  } = useForm<MenuFormValues>({ defaultValues: valuesFor(menu), shouldFocusError: false });
  const days = useWatch({ control, name: "days" });
  const [success, setSuccess] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [activeDay, setActiveDay] = useState((menu?.entries[0]?.dayOfWeek ?? 1) - 1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { onDirtyChange(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => {
    // Tải ngầm chỉ cập nhật form chưa sửa; không đè bản nháp của Kế toán.
    if (!isDirty) reset(valuesFor(menu));
  }, [menu, isDirty, reset]);
  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [isDirty]);

  const selectedCount = days.filter((day) => day.enabled).length;
  const remoteChanged = isDirty && JSON.stringify(defaultValues?.days) !== JSON.stringify(valuesFor(menu).days);
  const removedDays = MENU_DAYS.filter((day, index) => !days[index]?.enabled
    && menu?.entries.some((entry) => entry.dayOfWeek === day.value));
  const fieldMessages = MENU_DAYS.map((_, index) => errors.days?.[index]?.breakfast?.message).filter(Boolean).join(" ");

  function focusDay(index: number) {
    setActiveDay(index);
    requestAnimationFrame(() => setFocus(`days.${index}.breakfast`));
  }

  function showInvalidDay(invalid: FieldErrors<MenuFormValues>) {
    const index = MENU_DAYS.findIndex((_, dayIndex) => invalid.days?.[dayIndex]?.breakfast);
    if (index >= 0) focusDay(index);
  }

  async function submit(values: MenuFormValues, overwriteConfirmed = false) {
    if (isBusy) return;
    clearErrors();
    setSuccess("");
    const entries = entriesFor(values.days);
    if (!entries.length) {
      setError("root.server", { message: "Thực đơn tuần phải có ít nhất một ngày." });
      setFocus("days.0.enabled");
      return;
    }
    // PUT thay toàn bộ tuần: giữ bản nháp không đồng nghĩa với đồng ý ghi đè bản mới.
    if (remoteChanged && !overwriteConfirmed) {
      setConfirmOverwrite(true);
      return;
    }
    try {
      const saved = await onSave(entries);
      reset(valuesFor(saved));
      setSuccess(`Đã lưu thực đơn tuần ${formatMenuDate(week)} – ${formatMenuDate(shiftMenuDate(week, 6))}.`);
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch (error) {
      const apiError = toApiError(error);
      const otherMessages: string[] = [];
      const messagesByDay = new Map<number, string[]>();
      for (const message of apiError.errors?.length ? apiError.errors : [apiError.message]) {
        const index = MENU_DAYS.findIndex((day) => message.toLocaleLowerCase("vi").includes(day.label.toLocaleLowerCase("vi")));
        if (index < 0) otherMessages.push(message);
        else messagesByDay.set(index, [...(messagesByDay.get(index) ?? []), message]);
      }
      for (const [index, messages] of messagesByDay) {
        setError(`days.${index}.breakfast`, { type: "server", message: messages.join(" ") });
      }
      const firstInvalid = messagesByDay.keys().next().value;
      if (firstInvalid !== undefined) focusDay(firstInvalid);
      else requestAnimationFrame(() => headingRef.current?.focus());
      if (otherMessages.length) setError("root.server", { message: otherMessages.join(" ") });
    } finally {
      setConfirmOverwrite(false);
    }
  }

  return (
    <>
      <form noValidate onSubmit={(event) => { void handleSubmit((values) => submit(values), showInvalidDay)(event); }} onChange={() => setSuccess("")} className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">{menu ? "Chỉnh sửa thực đơn" : "Tạo thực đơn tuần"}</h2>
            <p className="mt-1 text-sm text-muted">Chọn ngày để xem hoặc nhập thực đơn.</p>
          </div>
          <span className="rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-sm font-medium text-brand-text">{selectedCount}/7 ngày</span>
        </div>
        {!menu && <p className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3 text-sm text-brand-text">Tuần này chưa có thực đơn. Bạn có thể lập thực đơn bên dưới.</p>}
        {remoteChanged && <p role="status" className="rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-sm">Thực đơn trên hệ thống vừa thay đổi. Bản nháp của bạn được giữ lại; chọn “Bỏ thay đổi” để xem bản mới trước khi lưu.</p>}
        {errors.root?.server && <p role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">{errors.root.server.message}</p>}
        {fieldMessages && <p role="alert" className="sr-only">{fieldMessages}</p>}
        {success && <p role="status" className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3 text-sm text-brand-text">{success}</p>}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Các ngày trong tuần" className="border-b border-border bg-background/40 p-3 lg:border-r lg:border-b-0">
            <div className="mb-3 flex items-center justify-between px-1 text-xs text-muted">
              <span className="font-medium">Ngày trong tuần</span><span>Có thực đơn</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-1">
              {MENU_DAYS.map((day, index) => {
                const enabled = days[index]?.enabled;
                const invalid = !!errors.days?.[index]?.breakfast;
                const active = activeDay === index;
                return (
                  <div key={day.value} className={cn(
                    "flex min-w-0 flex-col items-center rounded-xl border transition-colors lg:flex-row",
                    active ? "border-brand-border bg-brand-subtle" : "border-transparent hover:border-border hover:bg-card",
                    invalid && "border-danger-border!",
                  )}>
                    <button type="button" disabled={isBusy} aria-current={active ? "true" : undefined}
                      aria-controls={`menu-panel-${day.value}`}
                      aria-label={`${day.label}, ${formatMenuDate(shiftMenuDate(week, index))}${invalid ? ", cần kiểm tra" : ""}`}
                      onClick={() => setActiveDay(index)}
                      className="flex w-full min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 pt-2.5 pb-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 lg:flex-row lg:justify-between lg:px-3 lg:py-3.5">
                      <span className={cn("font-semibold", active ? "text-brand-text" : "text-foreground")}>
                        <span className="lg:hidden">{day.value === 7 ? "CN" : `T${day.value + 1}`}</span>
                        <span className="hidden lg:inline">{day.label}</span>
                      </span>
                      <span className={cn("text-xs tabular-nums", invalid ? "text-danger" : "text-muted")}>
                        {invalid ? "!" : formatMenuDate(shiftMenuDate(week, index)).slice(0, 5)}
                      </span>
                    </button>
                    <input type="checkbox" disabled={isBusy}
                      className="mb-2.5 h-4 w-4 shrink-0 cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-brand lg:mr-3 lg:mb-0"
                      aria-label={`Có thực đơn ${day.label.toLocaleLowerCase("vi")}`}
                      {...register(`days.${index}.enabled`, { onChange: () => {
                        setActiveDay(index);
                        clearErrors(`days.${index}`);
                        clearErrors("root.server");
                      } })} />
                    <span className="sr-only">{enabled ? "Đã chọn" : "Chưa chọn"}</span>
                  </div>
                );
              })}
            </div>
          </nav>
          <div className="min-w-0 p-4 sm:p-6">
            {MENU_DAYS.map((day, index) => {
              const enabled = days[index]?.enabled;
              const description = serializeMenuMeals(days[index]);
              const fieldError = errors.days?.[index]?.breakfast?.message
                ?? (description.length > 1000 ? "Tổng thực đơn trong ngày không được dài quá 1000 ký tự." : undefined);
              const id = `menu-day-${day.value}`;
              return (
                <section key={day.value} id={`menu-panel-${day.value}`} hidden={activeDay !== index} aria-labelledby={`${id}-title`}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <h3 id={`${id}-title`} className="text-base font-semibold">{day.label}</h3>
                      <p className="mt-1 text-sm text-muted">{formatMenuDate(shiftMenuDate(week, index))}</p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", enabled ? "bg-brand-subtle text-brand-text" : "bg-background text-muted")}>
                      {enabled ? "Có thực đơn" : "Chưa chọn"}
                    </span>
                  </div>
                  {enabled ? (
                    <div className="space-y-3">
                      {days[index].legacyDescription && <p className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-foreground">
                        Nội dung cũ chưa chia bữa được giữ trong ô Bữa sáng. Bạn có thể phân chia lại bên dưới.
                      </p>}
                      <FormField error={fieldError}>
                        <div className="space-y-3">
                          {/* Các bữa của ngày đang ẩn vẫn ở trong DOM để RHF kiểm tra khi lưu. */}
                          {MENU_MEALS.map((meal) => (
                            <div key={meal.key} className="rounded-xl border border-border bg-background/30 p-3 sm:p-4">
                              <FormField id={`${id}-${meal.key}`} label={meal.label} className="[&_label]:text-sm">
                                <Textarea id={`${id}-${meal.key}`} rows={2} maxLength={1000}
                                  disabled={isBusy} error={fieldError} aria-invalid={!!fieldError}
                                  aria-label={`${meal.label} ${day.label.toLocaleLowerCase("vi")}`}
                                  placeholder={meal.placeholder} className="min-h-20 resize-y leading-relaxed"
                                  {...register(`days.${index}.${meal.key}`, meal.key === "breakfast" ? {
                                    validate: (_, values) => {
                                      if (!values.days[index].enabled) return true;
                                      const content = serializeMenuMeals(values.days[index]);
                                      return (content.length > 0 && content.length <= 1000)
                                        || `Thực đơn ${day.label.toLocaleLowerCase("vi")} ${content ? "không được dài quá 1000 ký tự." : "phải có ít nhất một bữa ăn."}`;
                                    },
                                  } : { deps: [`days.${index}.breakfast`] })} />
                              </FormField>
                            </div>
                          ))}
                        </div>
                      </FormField>
                      <p className={cn("text-right text-xs tabular-nums", description.length > 1000 ? "font-medium text-danger" : "text-muted")}>
                        Tổng ba bữa: {description.length}/1000 ký tự
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/30 px-4 py-8 text-center lg:min-h-72">
                      <p className="font-medium text-foreground">Chưa chọn thực đơn cho ngày này</p>
                      <Button variant="outline" className="mt-4" disabled={isBusy} onClick={() => {
                        setValue(`days.${index}.enabled`, true, { shouldDirty: true });
                        clearErrors("root.server");
                        setSuccess("");
                        focusDay(index);
                      }}>Thêm thực đơn {day.label.toLocaleLowerCase("vi")}</Button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <p className="text-sm text-muted">Bỏ chọn ngày sẽ gỡ thực đơn của ngày đó khi lưu. Mỗi tuần cần ít nhất một ngày có thực đơn.</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-muted">{isDirty ? "Có thay đổi chưa lưu" : ""}</span>
            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <Button ref={resetButtonRef} variant="secondary" disabled={isBusy || !isDirty} onClick={() => setConfirmReset(true)}>Bỏ thay đổi</Button>
              <Button ref={saveButtonRef} type="submit" isLoading={isBusy} disabled={!!menu && !isDirty}>Lưu thực đơn</Button>
            </div>
          </div>
        </div>
      </form>
      <ConfirmDialog isOpen={confirmOverwrite} title="Thay toàn bộ thực đơn tuần?" variant="destructive"
        description={<div className="space-y-2">
          <p>Thực đơn trên hệ thống đã thay đổi. Lưu bản nháp sẽ thay toàn bộ thực đơn của tuần này, kể cả nội dung người khác vừa nhập. Các ngày không được chọn trong bản nháp sẽ bị gỡ.</p>
          {removedDays.length > 0 && <p className="font-medium text-foreground">Ngày sẽ bị gỡ: {removedDays.map((day) => day.label).join(", ")}.</p>}
          <p>Chọn “Quay lại” rồi “Bỏ thay đổi” nếu muốn nạp bản trên hệ thống.</p>
        </div>}
        confirmText="Thay toàn bộ" cancelText="Quay lại" isLoading={isBusy}
        onClose={() => { setConfirmOverwrite(false); saveButtonRef.current?.focus(); }}
        onConfirm={() => { void handleSubmit((values) => submit(values, true), (invalid) => {
          setConfirmOverwrite(false);
          showInvalidDay(invalid);
        })(); }} />
      <ConfirmDialog isOpen={confirmReset} title="Bỏ thay đổi chưa lưu?" description="Nội dung đang nhập sẽ được thay bằng thực đơn mới nhất đã tải cho tuần này."
        confirmText="Bỏ thay đổi" cancelText="Tiếp tục nhập"
        onClose={() => { setConfirmReset(false); resetButtonRef.current?.focus(); }}
        onConfirm={() => { reset(valuesFor(menu)); setSuccess(""); setConfirmReset(false); headingRef.current?.focus(); }} />
    </>
  );
}
