"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useApiMutation } from "@/hooks/useApiQuery";
import { toApiError, type ApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { HomeroomChildResponse } from "@/types/attendance";
import { RecordError, SavedNotice } from "./RecordFeedback";
import {
  createQuickHealth,
  formatRecordTime,
  getQuickHealth,
  isMood,
  isUncertainWrite,
  MOOD_OPTIONS,
  recordKeys,
  saveRecentRecord,
  UncertainWriteError,
  validateNotes,
  validateTemperature,
  type FormActivity,
  type QuickHealthRecord,
  type QuickHealthRequest,
} from "./_lib/health-incidents";

interface Fields {
  mood: string;
  temperature: string;
  notes: string;
}

const MOOD_META: Record<string, { label: string; icon: string }> = {
  Happy: { label: "Vui vẻ", icon: "😊" },
  Normal: { label: "Bình thường", icon: "🙂" },
  Tired: { label: "Mệt mỏi", icon: "😴" },
  Fussy: { label: "Quấy khóc", icon: "😢" },
};

const COMMON_TEMPERATURES = ["36.5", "37.0", "37.5", "38.2"];

export default function QuickHealthForm({
  child,
  userId,
  onActivity,
  onRecordSaved,
}: {
  child: HomeroomChildResponse;
  userId: string;
  onActivity: (activity: FormActivity) => void;
  onRecordSaved?: (record: QuickHealthRecord) => void;
}) {
  const client = useQueryClient();
  const [record, setRecord] = useState<QuickHealthRecord | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [unresolved, setUnresolved] = useState(false);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<Fields | null>(null);
  const endTrigger = useRef<HTMLButtonElement>(null);
  const writeLock = useRef(false);
  const attemptedPayload = useRef<QuickHealthRequest | null>(null);

  const form = useForm<Fields>({
    defaultValues: { mood: "", temperature: "", notes: "" },
  });
  const currentMood = useWatch({ control: form.control, name: "mood" });
  const currentTemp = useWatch({ control: form.control, name: "temperature" });
  const currentNotes = useWatch({ control: form.control, name: "notes" });

  // Đăng ký trường mood ẩn với validation
  useEffect(() => {
    form.register("mood", {
      validate: (value) => isMood(value) || "Vui lòng chọn 1 trong 4 tâm trạng của trẻ.",
    });
  }, [form]);

  const mutation = useApiMutation<QuickHealthRecord, QuickHealthRequest>({
    retry: false,
    mutationFn: async (payload) => {
      try {
        return await createQuickHealth(payload);
      } catch (failure) {
        if (failure instanceof UncertainWriteError && failure.recordId) {
          try {
            const recovered = await client.fetchQuery({
              queryKey: recordKeys.health(userId, failure.recordId),
              queryFn: ({ signal }) => getQuickHealth(failure.recordId!, child.id, signal),
              staleTime: 0,
              retry: false,
            });
            if (
              recovered.mood === payload.mood &&
              recovered.notes === payload.notes &&
              recovered.temperatureCelsius === payload.temperatureCelsius
            ) {
              return recovered;
            }
          } catch {
            // Giữ lỗi ghi chưa rõ kết quả nếu GET đối chiếu thất bại
          }
        }
        throw failure;
      }
    },
  });

  const pending = mutation.isPending || checking;

  useEffect(() => {
    // Chỉ coi là dirty khi giáo viên đã thực sự nhập ghi chú quan sát.
    // Việc chỉ bấm 1 nút tâm trạng hoặc gợi ý nhiệt độ không nên chặn chuyển đổi và khóa cuộn trang.
    const hasMeaningfulContent = Boolean(currentNotes?.trim());
    onActivity({
      dirty: !record && hasMeaningfulContent,
      locked: pending || unresolved,
    });
  }, [currentNotes, record, pending, unresolved, onActivity]);

  function handleRecordSuccess(saved: QuickHealthRecord) {
    setRecord(saved);
    saveRecentRecord(userId, {
      id: saved.id,
      childId: child.id,
      childFullName: child.fullName,
      type: "health",
      timeUtc: saved.recordedAtUtc,
      summary: `${MOOD_META[saved.mood]?.label ?? saved.mood}${
        saved.temperatureCelsius !== null ? ` · ${saved.temperatureCelsius} °C` : ""
      }`,
      detail: saved,
    });
    onRecordSaved?.(saved);
  }

  async function submit(values: Fields) {
    if (writeLock.current || record || unresolved || !isMood(values.mood)) return;
    writeLock.current = true;
    setError(null);
    try {
      const payload: QuickHealthRequest = {
        childId: child.id,
        mood: values.mood,
        temperatureCelsius: values.temperature.trim() ? Number(values.temperature) : null,
        notes: values.notes.trim(),
      };
      attemptedPayload.current = payload;
      const saved = await mutation.mutateAsync(payload);
      setPendingSubmit(null);
      handleRecordSuccess(saved);
      form.reset();
    } catch (failure) {
      setPendingSubmit(null);
      setError(toApiError(failure));
      setUnresolved(isUncertainWrite(failure));
      setRecoveryId(failure instanceof UncertainWriteError ? failure.recordId : null);
    } finally {
      writeLock.current = false;
    }
  }

  async function checkResult() {
    if (!recoveryId || !attemptedPayload.current || writeLock.current) return;
    writeLock.current = true;
    setChecking(true);
    try {
      const saved = await client.fetchQuery({
        queryKey: recordKeys.health(userId, recoveryId),
        queryFn: ({ signal }) => getQuickHealth(recoveryId, child.id, signal),
        staleTime: 0,
        retry: false,
      });
      const payload = attemptedPayload.current;
      if (
        saved.mood === payload.mood &&
        saved.notes === payload.notes &&
        saved.temperatureCelsius === payload.temperatureCelsius
      ) {
        handleRecordSuccess(saved);
        setUnresolved(false);
        setError(null);
        form.reset();
      }
    } catch (failure) {
      setError(toApiError(failure));
    } finally {
      writeLock.current = false;
      setChecking(false);
    }
  }

  function startNew() {
    setConfirmNew(false);
    setRecord(null);
    setUnresolved(false);
    setRecoveryId(null);
    setError(null);
    form.reset({ mood: "", temperature: "", notes: "" });
  }

  return (
    <div className="space-y-3.5">
      <RecordError error={error} />

      {unresolved && (
        <div
          className="space-y-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-foreground"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-warning mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-2">
              <p className="font-medium">Chưa xác định được kết quả ghi nhận từ máy chủ.</p>
              <p className="text-xs text-muted leading-relaxed">
                Bản ghi có thể đã được lưu. Hãy kiểm tra lại kết quả trước khi ghi tiếp để tránh tạo bản ghi trùng.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {recoveryId && (
                  <Button
                    variant="secondary"
                    isLoading={checking}
                    disabled={pending}
                    onClick={() => void checkResult()}
                    className="min-h-11"
                  >
                    Kiểm tra lại kết quả
                  </Button>
                )}
                <Button
                  ref={endTrigger}
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setConfirmNew(true)}
                  className="min-h-11"
                >
                  Kết thúc sau khi đối chiếu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {record ? (
        <div className="space-y-4">
          <SavedNotice>
            <h3 className="font-semibold text-sm text-success">
              Đã ghi nhận sức khỏe thành công cho {record.childFullName}
            </h3>
            <p className="text-xs text-muted">
              Lưu lúc {formatRecordTime(record.recordedAtUtc)} · Đã gửi thông báo tới phụ huynh
            </p>
          </SavedNotice>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-background/50 p-3 border border-border/80">
                <span className="text-xs font-semibold text-foreground block mb-1">Tâm trạng</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                  <span className="text-base leading-none">{MOOD_META[record.mood]?.icon}</span>
                  <span>{MOOD_META[record.mood]?.label ?? record.mood}</span>
                </span>
              </div>
              <div className="rounded-lg bg-background/50 p-3 border border-border/80">
                <span className="text-xs font-semibold text-foreground block mb-1">Thân nhiệt</span>
                <span className="text-sm font-medium text-muted">
                  {record.temperatureCelsius !== null ? `${record.temperatureCelsius} °C` : "Không đo thân nhiệt"}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-background/50 p-3 border border-border/80">
              <span className="text-xs font-semibold text-foreground block mb-1">Ghi chú quan sát</span>
              <p className="text-sm text-muted font-normal whitespace-pre-wrap wrap-anywhere leading-relaxed">
                {record.notes}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="primary" onClick={startNew} className="min-h-11 min-w-44 px-8 font-semibold">
              Ghi nhận tiếp cho trẻ này
            </Button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => setPendingSubmit(values))(event);
          }}
          className="space-y-4"
          aria-label="Ghi nhận sức khỏe nhanh"
          aria-busy={pending}
        >
          <fieldset disabled={pending || unresolved} className="min-w-0 space-y-4">
            {/* Trường 1: Tâm trạng - Dropdown 4 giá trị kết hợp phím chọn nhanh */}
            <FormField
              id="health-mood"
              label="Tâm trạng của trẻ"
              required
              error={form.formState.errors.mood?.message}
            >
              <div className="space-y-2">
                <Select
                  id="health-mood"
                  className="min-h-11"
                  placeholder="Chọn tâm trạng của trẻ..."
                  disabled={pending || unresolved}
                  error={form.formState.errors.mood?.message}
                  options={MOOD_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: `${MOOD_META[opt.value]?.icon ?? ""} ${opt.label}`.trim(),
                  }))}
                  value={currentMood}
                  onChange={(event) =>
                    form.setValue("mood", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />

                <div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  role="group"
                  aria-label="Chọn nhanh tâm trạng của trẻ"
                >
                  {MOOD_OPTIONS.map((opt) => {
                    const isSelected = currentMood === opt.value;
                    const meta = MOOD_META[opt.value];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={pending || unresolved}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2.5 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 text-xs",
                          isSelected
                            ? "border-brand bg-brand-subtle text-brand-text ring-1 ring-brand/20 font-semibold"
                            : "border-border bg-card hover:bg-background text-foreground hover:border-border-hover"
                        )}
                        onClick={() =>
                          form.setValue("mood", opt.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <span className="text-base leading-none">{meta?.icon}</span>
                        <span>{meta?.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FormField>

            {/* Trường 2: Nhiệt độ thân nhiệt */}
            <FormField
              id="health-temperature"
              label="Nhiệt độ thân nhiệt (°C)"
              hint="Tùy chọn (30.0 – 45.0 °C)"
              error={form.formState.errors.temperature?.message}
            >
              <div className="space-y-2">
                <Input
                  id="health-temperature"
                  type="number"
                  inputMode="decimal"
                  min={30}
                  max={45}
                  step={0.1}
                  placeholder="Ví dụ: 36.5"
                  className="min-h-11"
                  aria-invalid={Boolean(form.formState.errors.temperature)}
                  error={form.formState.errors.temperature?.message}
                  {...form.register("temperature", { validate: validateTemperature })}
                />

                {/* Các nút gợi ý nhanh nhiệt độ */}
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="group"
                  aria-label="Gợi ý thân nhiệt thông thường"
                >
                  <span className="text-[11px] text-muted mr-1">Gợi ý nhanh:</span>
                  {COMMON_TEMPERATURES.map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      disabled={pending || unresolved}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                        currentTemp === temp
                          ? "border-brand bg-brand-subtle text-brand-text font-semibold"
                          : "border-border bg-card text-muted hover:border-brand-border hover:text-brand-text hover:bg-brand-subtle/40"
                      )}
                      onClick={() =>
                        form.setValue("temperature", temp, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {temp} °C
                    </button>
                  ))}
                  {Boolean(currentTemp) && (
                    <button
                      type="button"
                      disabled={pending || unresolved}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-muted hover:text-danger cursor-pointer ml-1"
                      onClick={() =>
                        form.setValue("temperature", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </FormField>

            {/* Trường 3: Ghi chú quan sát */}
            <FormField
              id="health-notes"
              label="Ghi chú quan sát sức khỏe"
              required
              hint={`${currentNotes?.length ?? 0}/1000 ký tự`}
              error={form.formState.errors.notes?.message}
            >
              <Textarea
                id="health-notes"
                rows={3}
                maxLength={1000}
                placeholder="Nhập ghi chú quan sát sức khỏe của trẻ (biểu hiện ăn uống, giấc ngủ, triệu chứng nếu có)..."
                className="resize-y"
                aria-invalid={Boolean(form.formState.errors.notes)}
                error={form.formState.errors.notes?.message}
                {...form.register("notes", { validate: validateNotes })}
              />
            </FormField>
          </fieldset>

          {/* Action Button - Khoảng cách gọn gàng tham chiếu chuẩn theo nút ghi nhận tiếp */}
          <div className="flex items-center justify-center gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={pending}
              disabled={unresolved}
              className="min-h-11 min-w-44 px-8 font-semibold"
            >
              {pending ? "Đang lưu..." : "Lưu sức khỏe nhanh"}
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingSubmit)}
        title="Xác nhận ghi nhận sức khỏe"
        compactHeader={true}
        layout="stacked"
        confirmText="Xác nhận lưu"
        cancelText="Hủy"
        isLoading={pending}
        onClose={() => {
          if (!writeLock.current) setPendingSubmit(null);
        }}
        onConfirm={() => {
          if (pendingSubmit) void submit(pendingSubmit);
        }}
        description={
          pendingSubmit && (
            <div className="space-y-3 text-xs leading-relaxed text-foreground">
              <div className="rounded-lg bg-brand-subtle px-3 py-2 text-foreground">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">Trẻ: </span>
                  <strong className="font-bold text-foreground">{child.fullName}</strong>
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border/80 bg-background/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Tâm trạng:</span>
                  <span className="text-foreground">
                    {MOOD_META[pendingSubmit.mood]?.icon} {MOOD_META[pendingSubmit.mood]?.label ?? pendingSubmit.mood}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Thân nhiệt:</span>
                  <span className="text-foreground">
                    {pendingSubmit.temperature.trim() ? `${pendingSubmit.temperature} °C` : "Không đo thân nhiệt"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Ghi chú quan sát:</span>
                  <p className="whitespace-pre-wrap wrap-anywhere leading-relaxed text-foreground">
                    {pendingSubmit.notes}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted">
                Lưu ý: Bản ghi sức khỏe nhanh sẽ được lưu vào hồ sơ của trẻ và không thể chỉnh sửa hoặc xóa.
              </p>
            </div>
          )
        }
      />

      <ConfirmDialog
        isOpen={confirmNew}
        title="Đã đối chiếu kết quả ghi nhận?"
        compactHeader={true}
        layout="stacked"
        description="Chỉ kết thúc lượt này khi bạn đã kiểm tra với người phụ trách hoặc hệ thống để xác nhận bản ghi có được lưu hay chưa. Thao tác này không gửi lại bản ghi."
        confirmText="Đã đối chiếu"
        cancelText="Quay lại"
        onClose={() => {
          setConfirmNew(false);
          requestAnimationFrame(() => endTrigger.current?.focus());
        }}
        onConfirm={startNew}
      />
    </div>
  );
}
