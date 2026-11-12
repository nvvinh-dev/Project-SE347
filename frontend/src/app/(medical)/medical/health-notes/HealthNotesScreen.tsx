"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useSchoolChildren } from "@/hooks/useSchoolChildren";
import { formatDateOfBirth } from "@/lib/growth-measurements";
import { useHealthNotes } from "./_lib/useHealthNotes";

interface NotesFormValues { healthNotes: string }
interface DirectoryFormValues { search: string; notesFilter: string }

function searchable(value: string) {
  return value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function HealthNotesScreen() {
  const formId = useId();
  const childrenQuery = useSchoolChildren();
  const mutation = useHealthNotes();
  const [childId, setChildId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const submitLock = useRef(false);
  const detailRef = useRef<HTMLElement>(null);
  const directoryRef = useRef<HTMLElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const { register, control, reset, handleSubmit, setFocus, formState: { errors, isDirty } } = useForm<NotesFormValues>({
    defaultValues: { healthNotes: "" }, mode: "onChange",
  });
  const directory = useForm<DirectoryFormValues>({ defaultValues: { search: "", notesFilter: "all" } });
  const search = useWatch({ control: directory.control, name: "search" });
  const notesFilter = useWatch({ control: directory.control, name: "notesFilter" });
  const rawNotes = useWatch({ control, name: "healthNotes" }) ?? "";
  const trimmedLength = rawNotes.trim().length;
  const isOverLimit = trimmedLength > 1000;
  const schoolChildren = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);
  const selectedChild = schoolChildren.find((child) => child.id === childId);
  const filteredChildren = useMemo(() => {
    const term = searchable((search ?? "").trim());
    return schoolChildren.filter((child) => (!term || searchable(child.fullName).includes(term)) &&
      (notesFilter === "with" ? Boolean(child.healthNotes?.trim()) : notesFilter === "without" ? !child.healthNotes?.trim() : true));
  }, [schoolChildren, search, notesFilter]);
  const notesRegistration = register("healthNotes", {
    validate: (value) => value.trim().length <= 1000 || "Lưu ý sức khỏe không được dài quá 1000 ký tự.",
  });

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function selectChild(nextId: string) {
    const child = schoolChildren.find((item) => item.id === nextId);
    if (!child) return;
    setChildId(child.id);
    reset({ healthNotes: child.healthNotes ?? "" });
    mutation.reset();
    setSuccessMessage(null);
    setPendingChildId(null);
    setIsEditing(true);
    requestAnimationFrame(() => {
      setFocus("healthNotes", { shouldSelect: false });
      if (window.innerWidth < 1024) detailRef.current?.scrollIntoView({ block: "start" });
    });
  }

  function closeProfile() {
    setChildId(null);
    setIsEditing(false);
    reset({ healthNotes: "" });
    mutation.reset();
    setSuccessMessage(null);
    setPendingChildId(null);
    requestAnimationFrame(() => {
      directoryRef.current?.focus({ preventScroll: true });
      if (window.innerWidth < 1024) directoryRef.current?.scrollIntoView({ block: "start" });
    });
  }

  const saveNotes = async (healthNotes: string) => {
    if (!selectedChild || !isEditing || submitLock.current || healthNotes.trim().length > 1000) return;
    submitLock.current = true;
    setSuccessMessage(null);
    try {
      const updatedChild = await mutation.mutateAsync({ childId: selectedChild.id, healthNotes });
      reset({ healthNotes: updatedChild.healthNotes ?? "" });
      setSuccessMessage(updatedChild.healthNotes?.trim() ? "Đã lưu lưu ý sức khỏe thành công." : "Đã xóa lưu ý sức khỏe thành công.");
      setIsEditing(false);
      requestAnimationFrame(() => editButtonRef.current?.focus());
    } catch {
      // Giữ bản nhập khi máy chủ chưa xác nhận lưu thành công.
    } finally { submitLock.current = false; setIsDeleteOpen(false); }
  };

  const onSubmit = async (values: NotesFormValues) => {
    if (isDirty && !isOverLimit) await saveNotes(values.healthNotes);
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <PageHeader title="Lưu ý sức khỏe" description="Xem và cập nhật dị ứng, bệnh nền và những điều cần chú ý khi chăm sóc trẻ">
        <Button variant="secondary" size="sm" className="min-h-10" disabled={childrenQuery.isFetching || mutation.isPending}
          aria-busy={childrenQuery.isFetching} onClick={() => { void childrenQuery.refetch(); }}>
          <svg aria-hidden="true" className={`h-4 w-4 shrink-0 ${childrenQuery.isFetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.55-1.3L20 8M4 16l2.35 2.3A7 7 0 0 0 17.9 17" />
          </svg>
          Tải lại
        </Button>
      </PageHeader>

      {childrenQuery.isLoading ? <StatusMessage status="loading" title="Đang tải danh sách trẻ toàn trường..." />
        : childrenQuery.isError && !childrenQuery.data ? <StatusMessage status="error" title="Không thể tải danh sách trẻ" message={childrenQuery.error.message}
          onRetry={() => { void childrenQuery.refetch(); }} />
        : schoolChildren.length === 0 ? <StatusMessage status="empty" title="Chưa có trẻ để ghi lưu ý" message="Danh sách trẻ toàn trường hiện chưa có hồ sơ nào." />
        : <>
          {childrenQuery.isError && <div role="alert" className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger break-words [overflow-wrap:anywhere]">
            Chưa thể cập nhật danh sách trẻ mới nhất: {childrenQuery.error.message}. Bạn có thể tải lại danh sách.
          </div>}

          <section aria-label="Tìm và lọc lưu ý sức khỏe" className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <form onSubmit={(event) => event.preventDefault()} className="grid min-w-0 grid-cols-[minmax(0,1fr)_7.5rem] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <FormField id={`${formId}-search`} label="Tìm trẻ" className="min-w-0">
                <Input id={`${formId}-search`} type="search" className="min-h-10" placeholder="Tìm trẻ..." {...directory.register("search")} />
              </FormField>
              <FormField id={`${formId}-filter`} label="Lưu ý" className="min-w-0">
                <Select id={`${formId}-filter`} className="min-h-10" aria-label="Lọc lưu ý sức khỏe"
                  options={[{ value: "all", label: "Tất cả" }, { value: "with", label: "Có lưu ý" }, { value: "without", label: "Chưa có" }]}
                  {...directory.register("notesFilter")} />
              </FormField>
            </form>
          </section>

          <div className={`grid min-w-0 items-start gap-4 lg:gap-5 ${selectedChild ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}`}>
            <section ref={directoryRef} tabIndex={-1} aria-label="Danh sách trẻ và lưu ý" className={`min-w-0 scroll-mt-20 space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:p-5 ${selectedChild ? "hidden lg:block lg:p-4 lg:h-[max(32rem,calc(100dvh-17rem))] lg:overflow-y-auto" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Danh sách trẻ</h2>
                <p className="text-xs text-muted" aria-live="polite">{filteredChildren.length} trẻ</p>
              </div>
              {filteredChildren.length === 0 ? <StatusMessage status="empty" title="Không có trẻ phù hợp" message="Thử tên khác hoặc thay đổi bộ lọc lưu ý."
                action={<Button variant="secondary" onClick={() => directory.reset()}>Xóa bộ lọc</Button>} />
                : <ul className={`grid min-w-0 gap-3 ${selectedChild ? "" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
                  {filteredChildren.map((child) => <li key={child.id} className="min-w-0">
                    <Button variant="ghost" data-child-id={child.id} aria-pressed={child.id === childId}
                      aria-label={`Xem lưu ý của ${child.fullName}, sinh ngày ${formatDateOfBirth(child.dateOfBirth)}`}
                      disabled={mutation.isPending} onClick={() => {
                        if (child.id === childId && isEditing) { setFocus("healthNotes"); return; }
                        if (isDirty) setPendingChildId(child.id); else selectChild(child.id);
                      }}
                      className={`h-full w-full min-w-0 items-start rounded-xl border bg-card p-3 text-left shadow-xs sm:p-4 lg:p-3 xl:p-4 ${child.id === childId ? "border-brand-border ring-1 ring-brand-border" : "border-border"}`}>
                      <span className="block w-full min-w-0 space-y-2.5">
                        <span className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                          <span className="block min-w-0 flex-[1_1_9rem]">
                            <span className="block break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{child.fullName}</span>
                            <span className="mt-1 block text-xs font-normal text-muted">Ngày sinh: {formatDateOfBirth(child.dateOfBirth)}</span>
                          </span>
                          <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${child.healthNotes?.trim() ? "bg-warning-bg text-warning" : "bg-background text-muted"}`}>
                            {child.healthNotes?.trim() ? "Có lưu ý sức khỏe" : "Chưa có lưu ý"}
                          </span>
                        </span>
                        <span className={`line-clamp-2 whitespace-pre-wrap break-words text-sm font-normal leading-relaxed [overflow-wrap:anywhere] ${child.healthNotes?.trim() ? "text-foreground" : "italic text-muted-light"}`}>
                          {child.healthNotes?.trim() ? child.healthNotes : "Chưa có ghi chú dị ứng hoặc bệnh nền"}
                        </span>
                      </span>
                    </Button>
                  </li>)}
                </ul>}
            </section>

            {selectedChild && <section ref={detailRef} tabIndex={-1} aria-label="Hồ sơ lưu ý sức khỏe" data-testid="health-notes-detail"
              className="min-w-0 scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-brand/30 lg:scroll-mt-6 lg:max-h-[max(32rem,calc(100dvh-17rem))] lg:overflow-y-auto">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-brand-subtle/50 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-brand-text">Hồ sơ lưu ý sức khỏe</p>
                  <h2 id={`${formId}-profile-heading`} className="mt-1 break-words text-lg font-semibold text-foreground [overflow-wrap:anywhere]">{selectedChild.fullName}</h2>
                  <p className="mt-1 text-sm text-muted">Ngày sinh: {formatDateOfBirth(selectedChild.dateOfBirth)}</p>
                </div>
                <Button variant="ghost" size="sm" className="-mt-3 -mr-3 h-10 w-10 shrink-0 p-0" disabled={mutation.isPending}
                  aria-label="Thu gọn hồ sơ lưu ý sức khỏe" title="Về danh sách trẻ"
                  onClick={() => { if (isDirty) setPendingChildId(""); else closeProfile(); }}>
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="m6 6 12 12M6 18 18 6" /></svg>
                </Button>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                {successMessage && <p role="status" className="rounded-lg border border-success-border bg-success-bg p-3 text-sm text-success">{successMessage}</p>}
                {!isEditing && <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Lưu ý sức khỏe</h3>
                  {selectedChild.healthNotes?.trim() ? <div className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-bg/90 p-4">
                    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" />
                    </svg>
                    <p data-testid="saved-health-notes" className="min-w-0 select-text whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{selectedChild.healthNotes}</p>
                  </div>
                    : <p data-testid="saved-health-notes" className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted">Hồ sơ của trẻ hiện chưa có lưu ý sức khỏe.</p>}
                </div>}

                {!isEditing && <div className="flex justify-end">
                  <Button ref={editButtonRef} size="sm" className="min-h-10" onClick={() => {
                    reset({ healthNotes: selectedChild.healthNotes ?? "" });
                    mutation.reset(); setSuccessMessage(null); setIsEditing(true);
                    requestAnimationFrame(() => setFocus("healthNotes"));
                  }}>{selectedChild.healthNotes?.trim() ? "Chỉnh sửa lưu ý" : "+ Thêm lưu ý"}</Button>
                </div>}

                {isEditing && <form noValidate className="space-y-3" onSubmit={(event) => { void handleSubmit(onSubmit)(event); }}>
                  <FormField id={`${formId}-health-notes`} label="Lưu ý sức khỏe" error={errors.healthNotes?.message}>
                    <Textarea id={`${formId}-health-notes`} rows={7} className="min-h-40 resize-y leading-relaxed" placeholder="Nhập lưu ý sức khỏe cần thiết khi chăm sóc trẻ..."
                      {...notesRegistration} disabled={mutation.isPending} error={errors.healthNotes?.message} aria-invalid={Boolean(errors.healthNotes)}
                      aria-describedby={`${formId}-notes-count`} onChange={(event) => {
                        void notesRegistration.onChange(event); mutation.reset(); setSuccessMessage(null);
                      }} />
                  </FormField>
                  <p id={`${formId}-notes-count`} aria-live="polite" className={`text-right text-xs ${isOverLimit ? "font-semibold text-danger" : "text-muted"}`}>
                    {trimmedLength} / 1000 ký tự
                  </p>
                  {mutation.isPending && <p role="status" className="rounded-lg bg-brand-subtle p-3 text-sm text-brand-text">Đang lưu lưu ý sức khỏe...</p>}
                  {mutation.isError && <div role="alert" className="space-y-1 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger">
                    <p className="font-semibold">Chưa thể lưu lưu ý sức khỏe</p>
                    <p className="break-words [overflow-wrap:anywhere]">{mutation.error.message}</p>
                    <p className="text-xs">Nội dung vừa nhập được giữ nguyên. Kiểm tra lại trước khi lưu tiếp.</p>
                  </div>}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    {selectedChild.healthNotes?.trim() && <Button variant="secondary" className="min-h-10 border-danger-border bg-danger-bg text-danger hover:bg-danger-bg"
                      disabled={mutation.isPending} onClick={() => setIsDeleteOpen(true)}>Xóa lưu ý</Button>}
                    <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
                      <Button type="submit" className="min-h-10 flex-1 sm:flex-none" isLoading={mutation.isPending} disabled={!isDirty || isOverLimit}>Lưu lưu ý</Button>
                    </div>
                  </div>
                </form>}
              </div>
            </section>}
          </div>
        </>}

      <ConfirmDialog isOpen={isDeleteOpen} title="Xóa lưu ý sức khỏe?" layout="stacked" compactHeader variant="destructive"
        description={`Lưu ý sức khỏe của ${selectedChild?.fullName ?? "trẻ"} sẽ được xóa sau khi xác nhận.`}
        confirmText="Xóa lưu ý" cancelText="Hủy" isLoading={mutation.isPending}
        onClose={() => setIsDeleteOpen(false)} onConfirm={() => { void saveNotes(""); }} />
      <ConfirmDialog isOpen={pendingChildId !== null} title="Bỏ thay đổi chưa lưu?" layout="stacked" compactHeader
        description="Nội dung lưu ý sức khỏe vừa nhập chưa được lưu. Đóng hồ sơ hoặc chuyển trẻ sẽ làm mất những thay đổi này."
        confirmText="Bỏ thay đổi" cancelText="Tiếp tục sửa" onClose={() => setPendingChildId(null)} onConfirm={() => { if (pendingChildId === "") closeProfile(); else if (pendingChildId) selectChild(pendingChildId); }} />
    </div>
  );
}
