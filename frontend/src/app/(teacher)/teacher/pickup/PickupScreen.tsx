"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { ApiError, toApiError } from "@/lib/axios";
import {
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendanceForDate,
  getVietnamDate,
} from "@/lib/attendance";
import type { AttendanceResponse } from "@/types/attendance";
import PickupChildCard from "./PickupChildCard";
import {
  createPickup,
  getPickups,
  getPickupPersons,
  isValidPickupDate,
  parsePickupDate,
  pickupKeys,
  samePerson,
} from "./_lib/pickup";
import { PICKUP_METHOD_LABELS, type CreatePickupRequest, type PickupPerson, type PickupRecord } from "./_types/pickup";

interface Filters {
  search: string;
  status: string;
  date: string;
}
interface PhoneForm {
  pickerFullName: string;
  pickupPersonId: string;
}
interface Pending {
  child: AttendanceResponse;
  persons: PickupPerson[];
  person: PickupPerson | null;
  date: string;
}
interface Submission {
  selection: Pending;
  payload: CreatePickupRequest;
  postStarted: boolean;
}
interface UnresolvedPickup {
  childId: string;
  childName: string;
  date: string;
}
interface Notice {
  kind: "success" | "error";
  message: string;
  errors?: string[] | null;
}

export default function PickupScreen() {
  const { user } = useAuth();
  return user ? <PickupWorkspace key={user.userId} userId={user.userId} /> : null;
}

function PickupWorkspace({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [today, setToday] = useState(() => getVietnamDate());
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [unresolved, setUnresolved] = useState<UnresolvedPickup | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const writeLock = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const datePicker = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const filters = useForm<Filters>({
    defaultValues: { search: "", status: "All", date: formatAttendanceDate(today) },
  });
  const { search = "", status = "All", date: dateText = "" } = useWatch({ control: filters.control });
  const date = parsePickupDate(dateText) ?? "";
  const phone = useForm<PhoneForm>({ defaultValues: { pickerFullName: "", pickupPersonId: "" } });
  const confirmingPersonId = useWatch({ control: phone.control, name: "pickupPersonId" });
  const dateIsValid = isValidPickupDate(date, today);
  const isToday = date === today;

  useEffect(() => {
    const updateDay = () => {
      const nextDay = getVietnamDate();
      if (nextDay !== today) {
        if (parsePickupDate(filters.getValues("date")) === today) {
          filters.setValue("date", formatAttendanceDate(nextDay));
        }
        setToday(nextDay);
      }
    };
    const timer = window.setInterval(updateDay, 15_000);
    window.addEventListener("focus", updateDay);
    document.addEventListener("visibilitychange", updateDay);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateDay);
      document.removeEventListener("visibilitychange", updateDay);
    };
  }, [today, filters]);

  const attendance = useApiQuery({
    queryKey: pickupKeys.attendance(userId, date),
    queryFn: ({ signal }) => getAttendanceForDate(date, signal),
    enabled: dateIsValid,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: isToday ? 60_000 : false,
  });
  const pickups = useApiQuery({
    queryKey: pickupKeys.records(userId, date),
    queryFn: ({ signal }) => getPickups(date, signal),
    enabled: dateIsValid,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: isToday ? 60_000 : false,
  });

  const queries = [attendance, pickups];
  const dataReady = dateIsValid && queries.every((query) => query.isSuccess);
  const dataAvailable = dateIsValid && queries.every((query) => query.data !== undefined);
  const fetching = queries.some((query) => query.isFetching);

  function resolveOutcome(attempt: UnresolvedPickup, records: PickupRecord[]) {
    const saved = records.find((record) => record.childId === attempt.childId);
    setUnresolved(null);
    setNotice(saved ? {
      kind: "success",
      message: `Đã tìm thấy bản ghi đón về của ${saved.childFullName} — ${saved.pickerFullName}, lúc ${formatAttendanceTime(saved.pickupTimeUtc)}.`,
    } : {
      kind: "error",
      message: `Chưa có bản ghi đón về của ${attempt.childName} trong ngày ${formatAttendanceDate(attempt.date)}. ` +
        "Vui lòng đối chiếu lại trước khi xác nhận giao trẻ.",
    });
  }

  async function readLatestPickups(selectedDate: string) {
    const queryKey = pickupKeys.records(userId, selectedDate);
    // Hủy lượt đọc bắt đầu trước POST để không đối soát bằng kết quả cũ.
    await queryClient.cancelQueries({ queryKey, exact: true });
    return queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => getPickups(selectedDate, signal),
      staleTime: 0,
      retry: false,
    });
  }

  async function reload(): Promise<boolean> {
    if (!dateIsValid) return false;
    setRefreshing(true);
    try {
      const results = await Promise.all([attendance.refetch(), pickups.refetch()]);
      if (unresolved) {
        const records = unresolved.date === date && results[1].isSuccess
          ? results[1].data
          : await readLatestPickups(unresolved.date);
        resolveOutcome(unresolved, records);
      }
      await queryClient.invalidateQueries({ queryKey: ["teacher-pickup-persons", userId] });
      return results.every((result) => result.isSuccess);
    } catch (error) {
      setNotice({ kind: "error", message: toApiError(error).message });
      return false;
    } finally {
      setRefreshing(false);
    }
  }

  function closeDialog(success = false) {
    setPending(null);
    requestAnimationFrame(() => {
      if (!success && opener.current?.isConnected && !opener.current.disabled) opener.current.focus();
      else if (success && noticeRef.current) noticeRef.current.focus();
      else refreshButton.current?.focus();
    });
  }

  const mutation = useApiMutation<PickupRecord, Submission>({
    retry: false,
    mutationFn: async (submission) => {
      const { selection, payload } = submission;
      const assertToday = () => {
        if (selection.date !== getVietnamDate()) {
          throw new ApiError("Đã sang ngày mới. Vui lòng tải lại và chọn người đón cho hôm nay.", null, 409);
        }
      };
      assertToday();
      // Đối chiếu đúng người giáo viên đã xem; backend kiểm tra lớp, điểm danh và lượt đón.
      const freshPersons = await queryClient.fetchQuery({
        queryKey: pickupKeys.persons(userId, payload.childId),
        queryFn: ({ signal }) => getPickupPersons(payload.childId, signal),
        staleTime: 0,
        gcTime: 0,
        retry: false,
      });
      assertToday();
      const chosen = freshPersons.find((person) => person.id === payload.pickupPersonId);
      const previous = selection.persons.find((person) => person.id === payload.pickupPersonId);
      if (!chosen || !previous || !samePerson(previous, chosen)) {
        throw new ApiError("Thông tin người đón đã thay đổi. Vui lòng đối chiếu lại trước khi giao trẻ.", null, 409);
      }
      submission.postStarted = true;
      const record = await createPickup(payload, selection.date);
      if (record.attendanceId !== selection.child.id) {
        throw new ApiError("Chưa xác định được bản điểm danh gắn với lần đón. Vui lòng tải lại dữ liệu.", null, null);
      }
      return record;
    },
    onSuccess: async (record, { selection }) => {
      await queryClient.cancelQueries({
        queryKey: pickupKeys.records(userId, selection.date),
        exact: true,
      });
      queryClient.setQueryData<PickupRecord[]>(
        pickupKeys.records(userId, selection.date),
        (current = []) => [...current.filter((item) => item.childId !== record.childId), record],
      );
      setNotice({
        kind: "success",
        message: `Đã ghi nhận đón về: ${record.childFullName} — ${record.pickerFullName}, lúc ${formatAttendanceTime(record.pickupTimeUtc)}.`,
      });
      closeDialog(true);
    },
    onError: async (error, { selection, payload, postStarted }) => {
      const apiError = toApiError(error);
      const uncertain = postStarted && (
        apiError.status == null || apiError.status < 400 || apiError.status >= 500
      );
      const attempt = { childId: payload.childId, childName: selection.child.childFullName, date: selection.date };
      if (uncertain) setUnresolved(attempt);
      setNotice({ kind: "error", message: apiError.message, errors: apiError.errors });
      closeDialog();
      if (!postStarted) return;
      try {
        // Chỉ đọc lại kết quả; không tải lại người đón và ảnh của các trẻ khác.
        const records = await readLatestPickups(selection.date);
        if (uncertain) resolveOutcome(attempt, records);
        if (apiError.status === 404 || apiError.status === 409) {
          await queryClient.invalidateQueries({
            queryKey: pickupKeys.attendance(userId, selection.date),
            exact: true,
          });
        }
      } catch {
        // Giữ khóa khi chưa đọc được kết quả của POST; thao tác tải lại cho phép kiểm tra tiếp.
      }
    },
    onSettled: () => { writeLock.current = false; },
  });

  const busy = mutation.isPending || refreshing;
  const canWrite = isToday && dataReady && !fetching && !busy && !unresolved;
  const recordByChild = new Map((pickups.data ?? []).map((record) => [record.childId, record]));
  const children = (attendance.data ?? [])
    .filter((child) => child.status === "Present" && child.attendanceDate === date)
    .sort((a, b) => Number(recordByChild.has(a.childId)) - Number(recordByChild.has(b.childId)));
  const pickedUp = children.filter((child) => recordByChild.has(child.childId)).length;
  const filtered = children.filter((child) => {
    const matchesName = child.childFullName.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"));
    const picked = recordByChild.has(child.childId);
    return matchesName && (status === "All" || (status === "PickedUp" ? picked : !picked));
  });
  const metrics = [
    { label: isToday ? "Có mặt hôm nay" : "Có mặt trong ngày", value: children.length, color: "text-success" },
    { label: isToday ? "Đang chờ đón" : "Chưa ghi nhận đón về", value: children.length - pickedUp, color: "text-warning" },
    { label: "Đã đón về", value: pickedUp, color: "text-success" },
  ];

  function choose(
    child: AttendanceResponse,
    persons: PickupPerson[],
    person: PickupPerson | null,
    trigger: HTMLButtonElement,
  ) {
    if (!canWrite || date !== getVietnamDate() || writeLock.current) return;
    opener.current = trigger;
    phone.reset({ pickerFullName: "", pickupPersonId: "" });
    setNotice(null);
    setPending({ child, persons, person, date });
  }

  function submit(values?: PhoneForm) {
    if (!pending || writeLock.current || busy) return;
    if (pending.date !== getVietnamDate()) {
      setNotice({ kind: "error", message: "Đã sang ngày mới. Vui lòng tải lại và chọn người đón cho hôm nay." });
      closeDialog();
      return;
    }
    if (unresolved) {
      setNotice({ kind: "error", message: "Cần tải lại để kiểm tra kết quả ghi nhận trước đó trước khi giao trẻ tiếp." });
      closeDialog();
      return;
    }
    const personId = pending.person?.id ?? values?.pickupPersonId;
    if (!personId) return;
    const payload: CreatePickupRequest = {
      childId: pending.child.childId,
      pickupPersonId: personId,
      pickupMethod: pending.person ? (pending.person.priority === 1 ? "Primary" : "Backup") : "PhoneConfirmed",
      ...(!pending.person && values ? { pickerFullName: values.pickerFullName.trim() } : {}),
    };
    writeLock.current = true;
    mutation.mutate({ selection: pending, payload, postStarted: false });
  }

  const errorQuery = queries.find((query) => query.isError && query.data === undefined);
  const backgroundError = queries.find((query) => query.isError && query.data !== undefined);
  const loading = dateIsValid && queries.some((query) => query.isPending);
  const confirmingPerson = pending?.persons.find((person) => person.id === confirmingPersonId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Đón trẻ buổi chiều"
        description="Xác minh người đón và ghi nhận đón về cho trẻ có mặt hôm nay."
      />
      <section aria-label="Số trẻ trong ngày đã chọn" aria-busy={loading}>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`min-w-0 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:p-4 ${
                index === 0 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <dt className="text-xs font-medium leading-tight text-muted">{metric.label}</dt>
              <dd className="mt-2.5 flex items-baseline justify-between gap-2">
                <span className={`text-xl font-bold tabular-nums sm:text-2xl ${metric.color}`}>
                  {dataAvailable ? metric.value : "—"}
                </span>
                <span className="text-xs text-muted-light">trẻ</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-label="Đón về trong ngày" className="min-w-0 rounded-xl border border-border bg-card shadow-xs">
        <form onSubmit={(event) => event.preventDefault()} className="border-b border-border p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-3 md:grid-cols-[11rem_minmax(0,1fr)_12rem_2.75rem]">
            <FormField
              id="pickup-date"
              label="Ngày đón về"
              error={dateText && !dateIsValid
                ? "Nhập ngày hợp lệ theo dd/mm/yyyy, không muộn hơn hôm nay."
                : undefined}
              className="col-span-2 min-w-0 md:col-span-1"
            >
              <Input
                id="pickup-date"
                placeholder="dd/mm/yyyy"
                inputMode="numeric"
                autoComplete="off"
                disabled={busy || !!pending}
                error={dateText && !dateIsValid ? "Ngày không hợp lệ" : undefined}
                aria-invalid={!!dateText && !dateIsValid}
                {...filters.register("date")}
                className="min-h-11"
                rightIcon={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Mở lịch chọn ngày đón về"
                    disabled={busy || !!pending}
                    className="min-h-9 min-w-9 p-1"
                    onClick={() => datePicker.current?.showPicker?.()}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                      />
                    </svg>
                  </Button>
                }
              />
              <Input
                ref={datePicker}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                max={today}
                value={date}
                disabled={busy || !!pending}
                className="sr-only"
                onChange={(event) => filters.setValue(
                  "date", event.target.value ? formatAttendanceDate(event.target.value) : "",
                )}
              />
            </FormField>
            <FormField id="pickup-search" label="Tìm theo tên trẻ" className="col-span-2 min-w-0 md:col-span-1">
              <Input
                id="pickup-search"
                placeholder="Nhập họ tên trẻ"
                {...filters.register("search")}
                className="min-h-11"
              />
            </FormField>
            <FormField id="pickup-status" label="Trạng thái đón về" className="min-w-0">
              <Select
                id="pickup-status"
                {...filters.register("status")}
                options={[
                  { value: "All", label: "Tất cả trạng thái" },
                  { value: "Waiting", label: "Chờ đón" },
                  { value: "PickedUp", label: "Đã đón" },
                ]}
                className="min-h-11"
              />
            </FormField>
            <Button
              ref={refreshButton}
              variant="secondary"
              size="sm"
              aria-label="Làm mới dữ liệu đón về"
              title="Làm mới dữ liệu đón về"
              aria-busy={refreshing}
              disabled={busy || !dateIsValid || !!pending}
              isLoading={refreshing}
              onClick={() => void reload()}
              className="mt-[1.375rem] h-11 w-11 p-0"
            >
              {!refreshing && (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0120 12M4 12a8 8 0 0013.9 5.9"
                  />
                </svg>
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-4 p-4">
          {!isToday && <p className="text-xs leading-relaxed text-muted">Chỉ xem dữ liệu trong ngày đã chọn. Chỉ ghi nhận đón về cho hôm nay.</p>}

          {notice && (
            <div
              ref={noticeRef}
              tabIndex={-1}
              role={notice.kind === "error" ? "alert" : "status"}
              className={`rounded-xl border p-4 text-sm wrap-anywhere focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                notice.kind === "success"
                  ? "border-success-border bg-success-bg text-success"
                  : "border-danger-border bg-danger-bg text-danger"
              }`}
            >
              <p>{notice.message}</p>
              {!!notice.errors?.length && (
                <ul className="mt-2 list-inside list-disc">
                  {notice.errors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              )}
            </div>
          )}
          {unresolved && (
            <div role="alert" className="space-y-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-foreground">
              <p>Chưa xác định được kết quả ghi nhận. Cần tải lại dữ liệu thành công trước khi giao trẻ tiếp.</p>
              <Button variant="secondary" disabled={busy} onClick={() => void reload()} className="min-h-11">Tải lại dữ liệu</Button>
            </div>
          )}

          {dateIsValid && !errorQuery && backgroundError && !unresolved && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-foreground"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p>Chưa cập nhật được dữ liệu mới. Đang hiển thị dữ liệu đã tải; tạm khóa giao trẻ.</p>
                <p className="mt-1 text-xs text-muted">{backgroundError.error?.message}</p>
              </div>
              <Button variant="secondary" size="sm" disabled={busy || !!pending} onClick={() => void reload()}>
                Tải lại dữ liệu
              </Button>
            </div>
          )}

          {(search || status !== "All") && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  filters.setValue("search", "");
                  filters.setValue("status", "All");
                }}
                className="min-h-11"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {!dateIsValid ? (
            <StatusMessage status="empty" title="Chọn ngày đón về" message="Vui lòng chọn ngày hợp lệ, không muộn hơn hôm nay." />
          ) : errorQuery ? (
            <StatusMessage
              status="error"
              title="Không thể tải dữ liệu đón về"
              message={errorQuery.error?.message}
              onRetry={() => void reload()}
            />
          ) : loading ? (
            <StatusMessage status="loading" title="Đang tải dữ liệu đón về..." />
          ) : !children.length ? (
            <StatusMessage
              status="empty"
              title="Chưa có trẻ có mặt trong ngày"
              message="Chỉ trẻ đã điểm danh có mặt mới được ghi nhận đón về."
              action={isToday ? (
                <Link
                  href="/teacher/attendance"
                  className="text-sm font-medium text-brand-text underline underline-offset-4"
                >
                  Mở điểm danh vào lớp
                </Link>
              ) : undefined}
            />
          ) : !filtered.length ? (
            <StatusMessage status="empty" title="Không có trẻ phù hợp bộ lọc" message="Hãy đổi tên tìm kiếm hoặc trạng thái đón về." />
          ) : (
            <>
              <div className="grid items-start gap-4 xl:grid-cols-2">
                {filtered.map((child) => (
                  <PickupChildCard
                    key={`${date}:${child.childId}`}
                    child={child}
                    record={recordByChild.get(child.childId)}
                    userId={userId}
                    today={isToday}
                    canWrite={canWrite}
                    onChoose={choose}
                  />
                ))}
              </div>
              <div className="-mx-4 space-y-1 border-t border-border px-4 pt-3 text-xs text-muted">
                {isToday && <p>Đối chiếu khuôn mặt với ảnh đã đăng ký; kiểm tra CCCD khi cần.</p>}
                <p>Hiển thị {filtered.length}/{children.length} trẻ có mặt · {formatAttendanceDate(date)}</p>
              </div>
            </>
          )}

        </div>
      </section>

      <ConfirmDialog
        isOpen={!!pending}
        title={pending?.person ? "Xác nhận giao trẻ" : "Người khác đến đón"}
        confirmText="Xác nhận giao trẻ"
        cancelText="Hủy"
        isLoading={mutation.isPending}
        onClose={() => {
          if (!writeLock.current) closeDialog();
        }}
        onConfirm={() => {
          if (pending?.person) submit();
          else void phone.handleSubmit((values) => submit(values))();
        }}
        description={pending && (
          <div
            className={`max-h-[calc(100dvh-17rem)] space-y-3 overflow-y-auto overscroll-contain pr-1 wrap-anywhere ${
              pending.person
                ? "w-[min(21rem,calc(100vw-9rem))]"
                : "-ml-15 w-[min(24.75rem,calc(100vw-5.125rem))] pt-5"
            }`}
          >
            <div className="rounded-lg bg-brand-subtle px-3 py-2">
              <p className="text-sm text-foreground"><span className="text-muted">Trẻ: </span><strong>{pending.child.childFullName}</strong></p>
            </div>
            {pending.person ? (
              <div className="space-y-2">
                <p>Giao trẻ cho <strong className="text-foreground">{pending.person.fullName}</strong>.</p>
                <p className="text-xs">{PICKUP_METHOD_LABELS[pending.person.priority === 1 ? "Primary" : "Backup"]} · {pending.person.relationship}</p>
                <p className="text-xs">CCCD: {pending.person.citizenIdNumber}</p>
                <p>Chỉ xác nhận sau khi đã đối chiếu người đến đón.</p>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={(event) => { void phone.handleSubmit((values) => submit(values))(event); }}>
                <FormField
                  id="picker-name"
                  label="Họ tên người đến đón"
                  required
                  error={phone.formState.errors.pickerFullName?.message}
                >
                  <Input
                    id="picker-name"
                    autoComplete="off"
                    disabled={mutation.isPending}
                    error={phone.formState.errors.pickerFullName?.message}
                    aria-invalid={!!phone.formState.errors.pickerFullName}
                    {...phone.register("pickerFullName", {
                      validate: (value) => value.trim().length > 0
                        ? value.trim().length <= 100 || "Họ tên không được dài quá 100 ký tự."
                        : "Vui lòng nhập họ tên người đến đón.",
                    })}
                  />
                </FormField>
                <FormField
                  id="confirming-person"
                  label="Người đã xác nhận"
                  required
                  error={phone.formState.errors.pickupPersonId?.message}
                >
                  <Select
                    id="confirming-person"
                    disabled={mutation.isPending}
                    error={phone.formState.errors.pickupPersonId?.message}
                    aria-invalid={!!phone.formState.errors.pickupPersonId}
                    placeholder="Chọn người đã đồng ý"
                    options={pending.persons.map((person) => ({
                      value: person.id,
                      label: `${person.fullName} (${person.relationship})`,
                    }))}
                    {...phone.register("pickupPersonId", {
                      validate: (value) => pending.persons.some((person) => person.id === value) ||
                        "Vui lòng chọn người đã đồng ý.",
                    })}
                  />
                </FormField>
                {confirmingPerson && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-foreground">
                      {confirmingPerson.fullName}{" "}
                      <span className="font-normal text-muted">({confirmingPerson.relationship})</span>
                    </p>
                    <p>{confirmingPerson.priority === 1 ? "Người đón chính" : "Người dự phòng"} · SĐT: {confirmingPerson.phoneNumber}</p>
                  </div>
                )}
                <p className="border-l-2 border-warning-border pl-2 text-xs font-medium text-foreground">Không ai xác nhận thì không giao trẻ.</p>
                <details className="text-xs text-muted">
                  <summary className="cursor-pointer font-medium text-brand-text">Hướng dẫn xác minh</summary>
                  <p className="mt-2">Tự gọi người đón chính trước; không nghe máy thì gọi dự phòng nếu có. Hệ thống không thực hiện cuộc gọi.</p>
                </details>
              </form>
            )}
          </div>
        )}
      />
    </div>
  );
}
