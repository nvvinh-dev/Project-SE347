"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import {
  createGrowthMeasurement,
  formatDateOfBirth,
  formatMeasurementDateTime,
  formatMeasurementNumber,
  getGrowthMeasurements,
  getSchoolChildren,
  parseMeasurementInput,
} from "./_lib/growth-measurements";
import type {
  GrowthMeasurement,
  GrowthMeasurementFormValues,
  SchoolChild,
} from "./_types/growth-measurements";

interface FormStateValues extends GrowthMeasurementFormValues {
  childId: string;
}

interface PendingSaveData {
  childId: string;
  childFullName: string;
  childDob: string;
  heightCm: number | null;
  weightKg: number | null;
}

interface FeedbackState {
  kind: "success" | "error" | "uncertain";
  text: string;
  warning?: string;
  errors?: string[] | null;
}

export function GrowthMeasurementsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const formId = useId();
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);

  // Khóa cờ đồng bộ ngăn chặn việc gửi đúp yêu cầu khi nhấn liên tiếp
  const submitLock = useRef(false);
  const saveButton = useRef<HTMLButtonElement>(null);
  const openFormButton = useRef<HTMLButtonElement>(null);
  const closeFormButton = useRef<HTMLButtonElement>(null);

  const [pendingSave, setPendingSave] = useState<PendingSaveData | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [unresolvedSave, setUnresolvedSave] = useState(false);
  const [historyRechecked, setHistoryRechecked] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    clearErrors,
    formState: { errors },
  } = useForm<FormStateValues>({
    defaultValues: {
      childId: "",
      heightCm: "",
      weightKg: "",
    },
  });

  const selectedChildId = useWatch({ control, name: "childId" });

  // Tách cache theo tài khoản để không dùng lại lịch sử của người dùng khác.
  const measurementsKey = (cId: string) => [
    "medical-growth-measurements",
    user?.userId,
    cId,
  ];

  const childrenQuery = useApiQuery<SchoolChild[]>({
    queryKey: ["medical-school-children", user?.userId],
    queryFn: ({ signal }) => getSchoolChildren(signal),
    enabled: Boolean(user?.userId),
    networkMode: "always",
    retry: false,
    staleTime: 60_000,
  });

  const schoolChildren = useMemo(
    () => childrenQuery.data ?? [],
    [childrenQuery.data]
  );

  const selectedChild = useMemo(
    () => schoolChildren.find((child) => child.id === selectedChildId) ?? null,
    [schoolChildren, selectedChildId]
  );

  const measurementsQuery = useApiQuery<GrowthMeasurement[]>({
    queryKey: measurementsKey(selectedChildId),
    queryFn: ({ signal }) => getGrowthMeasurements(selectedChildId, signal),
    enabled: Boolean(user?.userId && selectedChild),
    networkMode: "always",
    retry: false,
    staleTime: 0,
  });

  const measurements = measurementsQuery.data ?? [];

  const reloadHistory = async () => {
    const result = await measurementsQuery.refetch();
    if (unresolvedSave) setHistoryRechecked(result.isSuccess);
  };

  const closeConfirmation = () => {
    setPendingSave(null);
    requestAnimationFrame(() => saveButton.current?.focus());
  };

  // Giữ thao tác ghi và đọc lại tách biệt để lỗi tải lại không biến thành lỗi lưu.
  const mutation = useApiMutation<GrowthMeasurement, PendingSaveData>({
    mutationFn: (pending) =>
      createGrowthMeasurement(pending.childId, {
        heightCm: pending.heightCm,
        weightKg: pending.weightKg,
      }),
    retry: false,
    // Báo lỗi mất mạng ngay, không xếp hàng thao tác ghi để tự gửi khi có mạng trở lại.
    networkMode: "always",
    onSuccess: async (record, variables) => {
      const queryKey = measurementsKey(variables.childId);
      // Hủy GET cũ trước khi thêm bản ghi mới, tránh phản hồi cũ ghi đè cache.
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<GrowthMeasurement[]>(
        queryKey,
        (previous = []) => [
          record,
          ...previous.filter((item) => item.id !== record.id),
        ]
      );

      const parts: string[] = [];
      if (record.heightCm != null) {
        parts.push(`chiều cao ${formatMeasurementNumber(record.heightCm)} cm`);
      }
      if (record.weightKg != null) {
        parts.push(`cân nặng ${formatMeasurementNumber(record.weightKg)} kg`);
      }

      setFeedback({
        kind: "success",
        text: `Đã lưu thành công số đo cho trẻ ${variables.childFullName}: ${parts.join(
          ", "
        )}.`,
      });

      closeConfirmation();
      setValue("heightCm", "");
      setValue("weightKg", "");

      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      closeConfirmation();
      if (error.status === 400) {
        setFeedback({
          kind: "error",
          text: error.message || "Dữ liệu nhập không hợp lệ.",
          errors: error.errors,
        });
      } else if (error.status === 404) {
        setFeedback({
          kind: "error",
          text: error.message || "Không tìm thấy hồ sơ học sinh trên hệ thống.",
        });
        void childrenQuery.refetch();
      } else if (error.status === 403) {
        setFeedback({
          kind: "error",
          text: error.message || "Bạn không có quyền thực hiện chức năng này.",
        });
      } else {
        // Khi mất kết nối hoặc lỗi máy chủ, bản ghi bất biến có thể đã được lưu nên không tự gửi lại
        setUnresolvedSave(true);
        setHistoryRechecked(false);
        setFeedback({
          kind: "uncertain",
          text: "Chưa xác định được kết quả ghi nhận từ máy chủ. Hãy tải lại và đối chiếu lịch sử trước khi nhập lần đo tiếp theo.",
          warning: error.message,
          errors: error.errors,
        });
      }
    },
    onSettled: () => {
      submitLock.current = false;
      requestAnimationFrame(() => saveButton.current?.focus());
    },
  });

  // Không mang số đo đang nhập sang hồ sơ của trẻ khác.
  const handleSelectChild = () => {
    if (mutation.isPending || unresolvedSave) return;
    setValue("heightCm", "");
    setValue("weightKg", "");
    clearErrors();
    setFeedback(null);
    setPendingSave(null);
  };

  const handleFormSubmit = (values: FormStateValues) => {
    if (submitLock.current || unresolvedSave) return;
    if (!selectedChild || selectedChild.id !== values.childId) {
      setError("childId", {
        type: "manual",
        message: "Vui lòng chọn một trẻ từ danh sách trước khi nhập số đo.",
      });
      return;
    }

    const heightParsed = parseMeasurementInput(values.heightCm, "height");
    if (!heightParsed.isValid) {
      setError("heightCm", {
        type: "manual",
        message: heightParsed.errorMessage,
      });
      setFocus("heightCm");
      return;
    }

    const weightParsed = parseMeasurementInput(values.weightKg, "weight");
    if (!weightParsed.isValid) {
      setError("weightKg", {
        type: "manual",
        message: weightParsed.errorMessage,
      });
      setFocus("weightKg");
      return;
    }

    if (heightParsed.value === null && weightParsed.value === null) {
      setError("heightCm", {
        type: "manual",
        message: "Cần nhập ít nhất chiều cao hoặc cân nặng.",
      });
      setFocus("heightCm");
      return;
    }

    clearErrors();
    setFeedback(null);
    setPendingSave({
      childId: values.childId,
      childFullName: selectedChild.fullName,
      childDob: selectedChild.dateOfBirth,
      heightCm: heightParsed.value,
      weightKg: weightParsed.value,
    });
  };

  const handleConfirmSave = () => {
    if (!pendingSave || submitLock.current || mutation.isPending || unresolvedSave ||
      pendingSave.childId !== selectedChild?.id) {
      return;
    }
    submitLock.current = true;
    mutation.mutate(pendingSave);
  };

  const columns: Column<GrowthMeasurement>[] = [
    {
      key: "measuredAtUtc",
      header: "Thời điểm đo",
      className: "min-w-44 whitespace-nowrap tabular-nums text-foreground font-medium",
      render: (record) => formatMeasurementDateTime(record.measuredAtUtc),
    },
    {
      key: "heightCm",
      header: "Chiều cao (cm)",
      className: "min-w-32 whitespace-nowrap tabular-nums text-foreground",
      render: (record) => formatMeasurementNumber(record.heightCm),
    },
    {
      key: "weightKg",
      header: "Cân nặng (kg)",
      className: "min-w-32 whitespace-nowrap tabular-nums text-foreground",
      render: (record) => formatMeasurementNumber(record.weightKg),
    },
  ];

  const childSelectOptions = useMemo(
    () =>
      schoolChildren.map((child) => ({
        value: child.id,
        label: `${child.fullName} — ${formatDateOfBirth(child.dateOfBirth)}`,
      })),
    [schoolChildren]
  );

  const isFormLocked = mutation.isPending || unresolvedSave || !selectedChild;

  const toggleMeasurementForm = () => {
    if (mutation.isPending || pendingSave !== null) return;
    const nextIsOpen = !isMeasurementFormOpen;
    setIsMeasurementFormOpen(nextIsOpen);
    requestAnimationFrame(() => {
      (nextIsOpen ? closeFormButton : openFormButton).current?.focus();
    });
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Theo dõi thể chất"
        description="Ghi nhận và xem chiều cao, cân nặng theo từng lần đo của trẻ."
      >
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-subtle px-3 text-xs font-medium text-brand-text">
          <span>Tổng số trẻ:</span>
          <span className="font-bold tabular-nums">
            {childrenQuery.data ? schoolChildren.length : "—"}
          </span>
          <span>học sinh</span>
        </span>
      </PageHeader>

      {feedback && (
        <div
          role={feedback.kind === "success" ? "status" : "alert"}
          className={`rounded-xl border p-4 text-sm leading-relaxed ${
            feedback.kind === "success"
              ? "border-success-border bg-success-bg text-success"
              : feedback.kind === "uncertain"
              ? "border-warning-border bg-warning-bg text-warning"
              : "border-danger-border bg-danger-bg text-danger"
          }`}
        >
          <p className="font-medium">{feedback.text}</p>
          {feedback.warning && (
            <p className="mt-1.5 text-xs text-muted">{feedback.warning}</p>
          )}
          {feedback.errors && feedback.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
              {feedback.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
          {unresolvedSave && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-foreground">
                Dữ liệu nhập được giữ nguyên. Hệ thống không tự gửi lại và không thể tự xác định lần gửi vừa rồi đã được lưu hay chưa.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="md" className="min-h-11 max-w-full whitespace-normal" disabled={measurementsQuery.isFetching}
                  onClick={() => { void reloadHistory(); }}>
                  Kiểm tra lại lịch sử
                </Button>
                {historyRechecked && (
                  <Button variant="secondary" size="md" className="min-h-11 max-w-full whitespace-normal" disabled={measurementsQuery.isFetching}
                    onClick={() => {
                      setUnresolvedSave(false);
                      setHistoryRechecked(false);
                      setValue("heightCm", "");
                      setValue("weightKg", "");
                      clearErrors();
                      setFeedback(null);
                    }}>
                    Đã đối chiếu, nhập lần đo tiếp theo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <section
        aria-label="Chọn trẻ cần theo dõi"
        className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs"
      >
        <div className="space-y-3">
          <FormField
            id={`${formId}-child`}
            label="Chọn học sinh"
            required
            error={errors.childId?.message}
          >
            {childrenQuery.data === undefined ? (
              <div className="py-2">
                <StatusMessage
                  status={childrenQuery.isError ? "error" : "loading"}
                  title={childrenQuery.isError ? "Không thể tải danh sách học sinh" : "Đang tải danh sách học sinh..."}
                  message={childrenQuery.error?.message}
                  onRetry={childrenQuery.isError ? () => {
                    void childrenQuery.refetch();
                  } : undefined}
                />
              </div>
            ) : schoolChildren.length === 0 ? (
              <div className="py-2">
                <StatusMessage
                  status="empty"
                  title="Chưa có dữ liệu học sinh"
                  message="Danh sách học sinh toàn trường hiện chưa có hồ sơ nào."
                />
              </div>
            ) : (
              <Select
                id={`${formId}-child`}
                placeholder="Chọn trẻ: Họ tên — dd/mm/yyyy"
                disabled={mutation.isPending || unresolvedSave}
                options={childSelectOptions}
                error={errors.childId?.message}
                aria-invalid={Boolean(errors.childId)}
                aria-describedby={`${formId}-child-help`}
                className="min-h-11 min-w-0 max-w-full"
                {...register("childId", { onChange: () => handleSelectChild() })}
              />
            )}
          </FormField>
          {childrenQuery.isError && childrenQuery.data !== undefined && (
            <div role="alert">
              <StatusMessage status="error" title="Chưa thể làm mới danh sách học sinh"
                message={`${childrenQuery.error.message} Danh sách bên dưới là dữ liệu tải thành công gần nhất.`}
                onRetry={() => { void childrenQuery.refetch(); }} />
            </div>
          )}

          {selectedChild && (
            <div className="rounded-lg border border-border/80 bg-background/50 p-3 text-xs leading-relaxed text-foreground">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="text-muted">Họ và tên: </span>
                  <span className="font-semibold text-foreground break-words">
                    {selectedChild.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Ngày sinh: </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatDateOfBirth(selectedChild.dateOfBirth)}
                  </span>
                </div>
              </div>
              {selectedChild.healthNotes && (
                <div className="mt-2 pt-2 border-t border-border/60 text-warning">
                  <span className="font-semibold">Lưu ý sức khỏe: </span>
                  <span className="whitespace-pre-wrap break-words">
                    {selectedChild.healthNotes}
                  </span>
                </div>
              )}
            </div>
          )}
          <p id={`${formId}-child-help`} className="text-xs text-muted">
            Chọn theo họ tên và ngày sinh để phân biệt các trẻ trùng tên.
            {errors.childId && <span className="sr-only"> {errors.childId.message}</span>}
          </p>
        </div>
      </section>

      <section
        aria-label="Theo dõi số đo"
        className={`grid min-w-0 items-start gap-6 ${isMeasurementFormOpen ? "xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}
      >
        <section
          aria-label="Ghi nhận số đo thể chất"
          hidden={!isMeasurementFormOpen}
          className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5 xl:col-start-2 xl:row-start-1"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Ghi nhận số đo
              </h2>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
                <li>Nhập ít nhất chiều cao hoặc cân nặng cho lần đo này.</li>
                <li>Thời điểm đo được hệ thống ghi nhận khi lưu.</li>
              </ul>
            </div>
            <Button
              ref={closeFormButton}
              variant="ghost"
              size="md"
              aria-label="Đóng khung ghi nhận số đo"
              title="Đóng khung ghi nhận số đo"
              disabled={mutation.isPending || pendingSave !== null}
              onClick={toggleMeasurementForm}
              className="h-11 w-11 shrink-0 p-0!"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 6l12 12M6 18 18 6" />
              </svg>
            </Button>
          </div>

          <div
            id={`${formId}-measurement-panel`}
            hidden={!isMeasurementFormOpen}
            className="mt-4 border-t border-border pt-4"
          >
            {!selectedChild ? (
              <StatusMessage status="empty" title="Chọn trẻ để nhập số đo"
                message="Vui lòng chọn học sinh trong danh sách hiện tại ở phía trên." />
            ) : (
              <form
                onSubmit={(event) => { void handleSubmit(handleFormSubmit)(event); }}
                className="space-y-4"
                noValidate
              >
                <FormField
                  id={`${formId}-height`}
                  label="Chiều cao (cm)"
                  error={errors.heightCm?.message}
                >
                  <Input
                    id={`${formId}-height`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ví dụ: 105,5"
                    rightIcon={<span aria-hidden="true" className="text-xs text-muted">cm</span>}
                    disabled={isFormLocked}
                    error={errors.heightCm?.message}
                    aria-invalid={Boolean(errors.heightCm)}
                    aria-describedby={`${formId}-height-help`}
                    className="min-h-11"
                    {...register("heightCm", {
                      onChange: () => { clearErrors("heightCm"); },
                    })}
                  />
                  <p id={`${formId}-height-help`} className="text-xs leading-relaxed text-muted">
                    Trên 0 đến 200 cm, tối đa 2 chữ số thập phân.
                    {errors.heightCm && <span className="sr-only"> {errors.heightCm.message}</span>}
                  </p>
                </FormField>

                <FormField
                  id={`${formId}-weight`}
                  label="Cân nặng (kg)"
                  error={errors.weightKg?.message}
                >
                  <Input
                    id={`${formId}-weight`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ví dụ: 17,25"
                    rightIcon={<span aria-hidden="true" className="text-xs text-muted">kg</span>}
                    disabled={isFormLocked}
                    error={errors.weightKg?.message}
                    aria-invalid={Boolean(errors.weightKg)}
                    aria-describedby={`${formId}-weight-help`}
                    className="min-h-11"
                    {...register("weightKg", {
                      onChange: () => { clearErrors("weightKg"); },
                    })}
                  />
                  <p id={`${formId}-weight-help`} className="text-xs leading-relaxed text-muted">
                    Trên 0 đến 100 kg, tối đa 2 chữ số thập phân.
                    {errors.weightKg && <span className="sr-only"> {errors.weightKg.message}</span>}
                  </p>
                </FormField>

                <div className="flex justify-center border-t border-border/60 pt-3">
                  <Button
                    type="submit"
                    ref={saveButton}
                    variant="outline"
                    size="md"
                    isLoading={mutation.isPending}
                    disabled={isFormLocked}
                    className="min-h-11 min-w-40 max-w-full bg-brand-subtle text-brand-text"
                  >
                    Lưu số đo
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section
          aria-label="Lịch sử số đo thể chất"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs xl:col-start-1 xl:row-start-1"
        >
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              <h2 className="text-sm font-semibold text-foreground">Lịch sử số đo</h2>
              <p className="mt-0.5 text-xs text-muted">
                {selectedChild
                  ? `Toàn bộ các lần đo của ${selectedChild.fullName}`
                  : "Hiển thị theo học sinh đang chọn"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isMeasurementFormOpen && (
                <Button
                  ref={openFormButton}
                  variant="secondary"
                  size="md"
                  aria-expanded={isMeasurementFormOpen}
                  aria-controls={`${formId}-measurement-panel`}
                  disabled={mutation.isPending || pendingSave !== null}
                  onClick={toggleMeasurementForm}
                  className="min-h-11"
                >
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 5v14M5 12h14" />
                  </svg>
                  Ghi nhận số đo
                </Button>
              )}
              {selectedChild && (
                <Button
                  variant="secondary"
                  size="md"
                  disabled={measurementsQuery.isFetching || mutation.isPending}
                  onClick={() => { void reloadHistory(); }}
                  className="min-h-11"
                  aria-label="Tải lại lịch sử số đo"
                  aria-busy={measurementsQuery.isFetching}
                  title="Tải lại lịch sử số đo"
                >
                  <svg aria-hidden="true" className={`h-4 w-4 shrink-0 ${measurementsQuery.isFetching ? "animate-spin" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.55-1.3L20 8M4 16l2.35 2.3A7 7 0 0 0 17.9 17" />
                  </svg>
                  Tải lại
                </Button>
              )}
            </div>
          </div>
          {selectedChild && measurementsQuery.isError && measurementsQuery.data !== undefined && (
            <div role="alert" className="p-4">
              <StatusMessage status="error" title="Chưa thể làm mới lịch sử số đo"
                message={`${measurementsQuery.error.message} Bên dưới là dữ liệu đã tải thành công gần nhất, kèm số đo vừa lưu nếu có.`}
                onRetry={() => { void reloadHistory(); }} />
            </div>
          )}

          {!selectedChild ? (
            <div className="p-4 sm:p-5">
              <StatusMessage
                status="empty"
                title="Chưa chọn trẻ"
                message="Vui lòng chọn một trẻ ở danh sách phía trên để xem toàn bộ lịch sử số đo thể chất."
              />
            </div>
          ) : measurementsQuery.data === undefined ? (
            <div className="p-4 sm:p-5">
              <StatusMessage
                status={measurementsQuery.isError ? "error" : "loading"}
                title={measurementsQuery.isError ? "Không thể tải lịch sử số đo" : "Đang tải lịch sử số đo..."}
                message={measurementsQuery.error?.message}
                onRetry={measurementsQuery.isError ? () => {
                  void reloadHistory();
                } : undefined}
              />
            </div>
          ) : measurements.length === 0 ? (
            <div className="p-4 sm:p-5">
              <StatusMessage
                status="empty"
                title="Chưa có số đo nào"
                message="Trẻ đã chọn chưa có lần ghi nhận chiều cao hoặc cân nặng nào trong hệ thống."
              />
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <DataTable<GrowthMeasurement>
                  columns={columns}
                  data={measurements}
                  keyExtractor={(row) => row.id}
                  className="border-0 rounded-none shadow-none"
                />
              </div>

              <ul className="divide-y divide-border/60 md:hidden">
                {measurements.map((record) => (
                  <li key={record.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span className="font-semibold text-foreground">
                        Thời điểm đo
                      </span>
                      <span className="tabular-nums">
                        {formatMeasurementDateTime(record.measuredAtUtc)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg border border-border/80 bg-background/50 p-2.5">
                        <p className="text-[11px] text-muted">Chiều cao (cm)</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                          {formatMeasurementNumber(record.heightCm)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background/50 p-2.5">
                        <p className="text-[11px] text-muted">Cân nặng (kg)</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                          {formatMeasurementNumber(record.weightKg)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted">
                <span>{measurements.length} bản ghi</span>
                <span>—: Không đo chỉ số này</span>
                <span>Bản ghi không thể sửa hoặc xóa</span>
              </div>
            </>
          )}
        </section>
      </section>

      <ConfirmDialog
        isOpen={pendingSave !== null}
        title="Xác nhận lưu số đo thể chất"
        confirmText="Xác nhận lưu"
        cancelText="Hủy"
        isLoading={mutation.isPending}
        onClose={() => {
          if (!mutation.isPending) {
            closeConfirmation();
          }
        }}
        onConfirm={handleConfirmSave}
        description={
          pendingSave ? (
            <div
              role="region"
              aria-label="Chi tiết số đo cần xác nhận"
              tabIndex={0}
              className="max-h-[40dvh] overflow-y-auto space-y-3 pr-1 text-sm focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            >
              <p className="text-muted leading-relaxed">
                Vui lòng kiểm tra lại thông tin số đo thể chất trước khi ghi nhận
                vào hệ thống:
              </p>
              <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 text-muted">Học sinh:</span>
                  <span className="min-w-0 font-semibold text-foreground text-right [overflow-wrap:anywhere]">
                    {pendingSave.childFullName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted">Ngày sinh:</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatDateOfBirth(pendingSave.childDob)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t border-border/60 pt-1.5">
                  <span className="text-muted">Chiều cao:</span>
                  <span className="font-semibold text-foreground">
                    {pendingSave.heightCm != null
                      ? `${formatMeasurementNumber(pendingSave.heightCm)} cm`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted">Cân nặng:</span>
                  <span className="font-semibold text-foreground">
                    {pendingSave.weightKg != null
                      ? `${formatMeasurementNumber(pendingSave.weightKg)} kg`
                      : "—"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-warning leading-relaxed font-medium">
                Lưu ý: Bản ghi số đo sau khi lưu vào hệ thống sẽ không thể sửa
                hoặc xóa.
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
