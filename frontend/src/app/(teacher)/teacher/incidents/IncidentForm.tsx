"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useApiMutation } from "@/hooks/useApiQuery";
import { ApiError, toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { HomeroomChildResponse } from "@/types/attendance";
import IncidentPhotos from "./IncidentPhotos";
import InvalidPhotoPreview from "./InvalidPhotoPreview";
import SelectedPhotoModal from "./SelectedPhotoModal";
import { RecordError, SavedNotice } from "./RecordFeedback";
import {
  attachIncidentPhotos,
  createIncident,
  formatRecordTime,
  getIncident,
  hasAttachedBatch,
  isUncertainWrite,
  occurredAtUtc,
  recordKeys,
  saveRecentRecord,
  UncertainWriteError,
  validateNotes,
  validateOccurredAt,
  validatePhotos,
  validateSinglePhoto,
  vietnamDateTime,
  type FormActivity,
  type IncidentRecord,
  type IncidentRequest,
} from "./_lib/health-incidents";

interface Fields {
  occurredAt: string;
  description: string;
  photos: File[];
}

interface UploadAttempt {
  before: IncidentRecord;
  count: number;
}

export default function IncidentForm({
  child,
  userId,
  onActivity,
  onRecordSaved,
}: {
  child: HomeroomChildResponse;
  userId: string;
  onActivity: (activity: FormActivity) => void;
  onRecordSaved?: (record: IncidentRecord) => void;
}) {
  const client = useQueryClient();
  const [record, setRecord] = useState<IncidentRecord | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [unresolvedCreate, setUnresolvedCreate] = useState(false);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [unresolvedUpload, setUnresolvedUpload] = useState<UploadAttempt | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<Fields | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [dismissSavedNotice, setDismissSavedNotice] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const endTrigger = useRef<HTMLButtonElement | null>(null);
  const writeLock = useRef(false);
  const attemptedPayload = useRef<IncidentRequest | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const cameraInput = useRef<HTMLInputElement | null>(null);

  const form = useForm<Fields>({
    defaultValues: { occurredAt: "", description: "", photos: [] },
  });
  const description = useWatch({ control: form.control, name: "description" });
  const occurredAt = useWatch({ control: form.control, name: "occurredAt" });
  const watchedFiles = useWatch({ control: form.control, name: "photos" });
  const files = useMemo(() => watchedFiles ?? [], [watchedFiles]);
  const photoField = useController({
    control: form.control,
    name: "photos",
    rules: { validate: (batch) => validatePhotos(batch) },
  });

  // Tạo URL xem trước cho các ảnh vừa chọn và dọn dẹp bộ nhớ khi danh sách thay đổi
  const previewItems = useMemo(() => {
    return files.map((file) => {
      const validation = validateSinglePhoto(file);
      return {
        file,
        url: validation.valid ? URL.createObjectURL(file) : null,
        validation,
      };
    });
  }, [files]);

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previewItems]);

  // Chỉ điều hướng trên ảnh hợp lệ; giữ chỉ số gốc để bỏ đúng tệp trong form.
  const viewableItems = previewItems.flatMap((item, sourceIndex) =>
    item.url ? [{ file: item.file, url: item.url, sourceIndex }] : []
  );

  const creation = useApiMutation<IncidentRecord, IncidentRequest>({
    retry: false,
    mutationFn: async (payload) => {
      try {
        return await createIncident(payload);
      } catch (failure) {
        if (failure instanceof UncertainWriteError && failure.recordId) {
          try {
            const recovered = await fetchRecord(failure.recordId);
            if (
              recovered.description === payload.description &&
              Date.parse(recovered.occurredAtUtc) === Date.parse(payload.occurredAtUtc)
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

  const upload = useApiMutation<IncidentRecord, { before: IncidentRecord; photos: File[] }>({
    retry: false,
    mutationFn: ({ before, photos }) => attachIncidentPhotos(before, photos),
  });

  const pending = creation.isPending || upload.isPending || checking;
  const unresolved = unresolvedCreate || Boolean(unresolvedUpload);

  useEffect(() => {
    const hasMeaningfulContent = Boolean(description?.trim() || occurredAt) || files.length > 0;
    onActivity({
      dirty: record ? files.length > 0 : hasMeaningfulContent,
      locked: pending || unresolved,
    });
  }, [description, occurredAt, files.length, record, pending, unresolved, onActivity]);

  function fetchRecord(id: string) {
    return client.fetchQuery({
      queryKey: recordKeys.incident(userId, id),
      queryFn: ({ signal }) => getIncident(id, child.id, signal),
      staleTime: 0,
      retry: false,
    });
  }

  function clearFiles() {
    setViewingIndex(null);
    form.setValue("photos", [], { shouldDirty: true, shouldValidate: true });
    if (photoInput.current) photoInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
  }

  function removeFileAt(index: number) {
    const removedViewIndex = viewableItems.findIndex((item) => item.sourceIndex === index);
    if (viewingIndex !== null && removedViewIndex !== -1) {
      if (viewableItems.length === 1) {
        setViewingIndex(null);
      } else if (removedViewIndex < viewingIndex) {
        setViewingIndex(viewingIndex - 1);
      } else if (removedViewIndex === viewingIndex) {
        setViewingIndex(Math.min(viewingIndex, viewableItems.length - 2));
      }
    }
    const nextFiles = files.filter((_, i) => i !== index);
    form.setValue("photos", nextFiles, { shouldDirty: true, shouldValidate: true });
    if (photoInput.current) photoInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
  }

  function addFiles(newFiles: FileList | File[] | null) {
    if (pending || unresolved || writeLock.current || !newFiles || newFiles.length === 0) return;
    const added = Array.from(newFiles);
    const combined = [...files, ...added];
    form.setValue("photos", combined, { shouldDirty: true, shouldValidate: true });
    if (photoInput.current) photoInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (pending || unresolved || files.length >= 5) return;
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (pending || unresolved || files.length >= 5) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleIncidentSuccess(saved: IncidentRecord) {
    setDismissSavedNotice(false);
    saveRecentRecord(userId, {
      id: saved.id,
      childId: child.id,
      childFullName: child.fullName,
      type: "incident",
      timeUtc: saved.occurredAtUtc,
      summary: saved.description.slice(0, 80),
    });
    onRecordSaved?.(saved);
  }

  async function uploadBatch(before: IncidentRecord, photos: File[]) {
    const validation = validatePhotos(photos);
    if (validation !== true) {
      setError(null);
      form.setError("photos", { message: validation });
      return;
    }
    setError(null);
    setUploadedCount(0);
    const attempt = { before, count: photos.length };
    try {
      const updated = await upload.mutateAsync({ before, photos });
      setRecord(updated);
      setUploadedCount(photos.length);
      setUnresolvedUpload(null);
      clearFiles();
      handleIncidentSuccess(updated);
    } catch (failure) {
      setError(toApiError(failure));
      if (isUncertainWrite(failure)) {
        setUnresolvedUpload(attempt);
        try {
          const updated = await fetchRecord(before.id);
          if (hasAttachedBatch(before, updated, photos.length)) {
            setRecord(updated);
            setUploadedCount(photos.length);
            setUnresolvedUpload(null);
            setError(null);
            clearFiles();
            handleIncidentSuccess(updated);
          }
        } catch {
          // Giữ khóa upload nếu chưa đối chiếu được
        }
      }
    }
  }

  async function submit(values: Fields) {
    if (writeLock.current || unresolved) return;
    if (record && !values.photos.length) {
      form.setError("photos", { message: "Vui lòng chọn ít nhất 1 ảnh để đính kèm." }, { shouldFocus: true });
      return;
    }
    writeLock.current = true;
    setError(null);
    try {
      let saved = record;
      if (!saved) {
        const utc = occurredAtUtc(values.occurredAt);
        if (!utc) return;
        const payload = { childId: child.id, occurredAtUtc: utc, description: values.description.trim() };
        attemptedPayload.current = payload;
        saved = await creation.mutateAsync(payload);
        setPendingSubmit(null);
        setRecord(saved);
        handleIncidentSuccess(saved);
        form.reset({ ...values, description: saved.description });
      }
      if (values.photos.length) {
        await uploadBatch(saved, values.photos);
      }
    } catch (failure) {
      setPendingSubmit(null);
      setError(toApiError(failure));
      setUnresolvedCreate(isUncertainWrite(failure));
      setRecoveryId(failure instanceof UncertainWriteError ? failure.recordId : null);
    } finally {
      writeLock.current = false;
    }
  }

  async function checkCreation() {
    if (!recoveryId || !attemptedPayload.current || writeLock.current) return;
    writeLock.current = true;
    setChecking(true);
    setError(null);
    try {
      const saved = await fetchRecord(recoveryId);
      const payload = attemptedPayload.current;
      if (
        saved.description === payload.description &&
        Date.parse(saved.occurredAtUtc) === Date.parse(payload.occurredAtUtc)
      ) {
        setRecord(saved);
        setUnresolvedCreate(false);
        setError(null);
        handleIncidentSuccess(saved);
      } else {
        setError(new ApiError(
          "Bản ghi trên hệ thống không khớp nội dung vừa gửi. Vui lòng đối chiếu trước khi ghi tiếp.",
          null,
          200
        ));
      }
    } catch (failure) {
      setError(toApiError(failure));
    } finally {
      writeLock.current = false;
      setChecking(false);
    }
  }

  async function checkUpload() {
    if (!unresolvedUpload || writeLock.current) return;
    writeLock.current = true;
    setChecking(true);
    setError(null);
    try {
      const updated = await fetchRecord(unresolvedUpload.before.id);
      if (hasAttachedBatch(unresolvedUpload.before, updated, unresolvedUpload.count)) {
        setRecord(updated);
        setUploadedCount(unresolvedUpload.count);
        setUnresolvedUpload(null);
        setError(null);
        clearFiles();
        handleIncidentSuccess(updated);
      } else {
        setError(new ApiError(
          "Ảnh trên hệ thống không khớp lượt vừa gửi. Vui lòng đối chiếu trước khi tải thêm.",
          null,
          200
        ));
      }
    } catch (failure) {
      setError(toApiError(failure));
    } finally {
      writeLock.current = false;
      setChecking(false);
    }
  }

  function startNew() {
    setConfirmEnd(false);
    setRecord(null);
    setDismissSavedNotice(false);
    setError(null);
    setUnresolvedCreate(false);
    setRecoveryId(null);
    setUnresolvedUpload(null);
    setUploadedCount(0);
    clearFiles();
    form.reset({ occurredAt: "", description: "", photos: [] });
    requestAnimationFrame(() => form.setFocus("occurredAt"));
  }

  return (
    <div className="space-y-3.5">
      <RecordError error={error} />

      {unresolved && (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-foreground"
        >
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-warning mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 " +
                "4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                }
              />
            </svg>
            <div className="space-y-2">
              <p className="font-medium">Chưa xác định được kết quả ghi nhận từ máy chủ.</p>
              <p className="text-xs text-muted leading-relaxed">
                {unresolvedCreate
                  ? (
                    "Sự cố có thể đã được lưu. Hãy kiểm tra kết quả đối chiếu trước khi " +
                    "tạo mới để tránh trùng lặp sự cố."
                  )
                  : (
                    "Sự cố đã được lưu, nhưng lượt đính ảnh chưa xác định kết quả. Hãy " +
                    "kiểm tra lại ảnh trước khi tải thêm."
                  )}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {unresolvedCreate && recoveryId && (
                  <Button
                    variant="secondary"
                    isLoading={checking}
                    disabled={pending}
                    onClick={() => void checkCreation()}
                    className="min-h-11"
                  >
                    Kiểm tra lại sự cố
                  </Button>
                )}
                {unresolvedUpload && (
                  <Button
                    variant="secondary"
                    isLoading={checking}
                    disabled={pending}
                    onClick={() => void checkUpload()}
                    className="min-h-11"
                  >
                    Kiểm tra lại ảnh
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={(event) => {
                    endTrigger.current = event.currentTarget;
                    setConfirmEnd(true);
                  }}
                  className="min-h-11"
                >
                  Kết thúc sau khi đối chiếu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị chi tiết bản ghi sự cố sau khi đã lưu */}
      {record ? (
        <div className="space-y-4">
          {!dismissSavedNotice && (
            <SavedNotice onDismiss={() => setDismissSavedNotice(true)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-success">
                  Đã ghi nhận sự cố thành công cho {record.childFullName}
                </h3>
                <span className="text-xs text-muted">
                  {formatRecordTime(record.occurredAtUtc)}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                <span>Hệ thống gửi thông báo tới phụ huynh của trẻ và nhân viên y tế.</span>
              </p>
            </SavedNotice>
          )}

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            {uploadedCount > 0 && (
              <div
                role="status"
                className={
                  "flex items-center justify-between gap-2 rounded-lg border border-success-border/60 " +
                  "bg-success-bg px-3 py-2 text-xs text-success"
                }
              >
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Vừa đính kèm {uploadedCount} ảnh thành công vào sự cố này.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label="Đóng thông báo đính kèm ảnh"
                  title="Đóng thông báo"
                  onClick={() => setUploadedCount(0)}
                  style={{ padding: 0 }}
                  className={
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-success/80 " +
                    "hover:bg-success/15 hover:text-success cursor-pointer transition-colors -mr-0.5"
                  }
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            )}

            {/* Ảnh sự cố đã lưu */}
            {record.photos.length > 0 && (
              <IncidentPhotos record={record} userId={userId} hideEmpty={true} />
            )}

            {/* Mỗi lượt bổ sung được chọn tối đa 5 ảnh, độc lập với ảnh đã lưu. */}
            <div className="pt-1">
              {files.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) {
                      addFiles(e.dataTransfer.files);
                    }
                  }}
                  className={
                    "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed " +
                    "border-border/80 bg-background/50 px-3 py-2 text-xs"
                  }
                >
                  <p className="min-w-0 max-w-full text-muted">
                    Bổ sung thêm ảnh minh chứng?{" "}
                    <span className="text-[11px]">(Mỗi lượt tối đa 5 ảnh)</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending || unresolved}
                      onClick={() => photoInput.current?.click()}
                      className="h-8 gap-1.5 px-2.5 text-xs"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Chọn ảnh</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={pending || unresolved}
                      onClick={() => cameraInput.current?.click()}
                      className="h-8 gap-1.5 px-2.5 text-xs"
                    >
                      <svg
                        className="h-3.5 w-3.5 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 " +
                            "1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          }
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Chụp ảnh</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 rounded-lg border border-brand-border/60 bg-brand-subtle/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-text">
                      Ảnh chuẩn bị đính thêm ({files.length} ảnh)
                    </span>
                    <Button variant="ghost" size="sm"
                      type="button"
                      disabled={pending || unresolved}
                      onClick={clearFiles}
                      className="text-xs text-muted hover:text-danger cursor-pointer transition-colors"
                    >
                      Bỏ chọn
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {previewItems.map((item, index) => (
                      <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-card">
                        {item.url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            style={{ padding: 0 }}
                            aria-label={`Xem ảnh lớn ${item.file.name}`}
                            title="Bấm để xem ảnh phóng to"
                            onClick={() => setViewingIndex(viewableItems.findIndex((photo) => photo.sourceIndex === index))}
                            className="h-full w-full cursor-zoom-in text-left focus:outline-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={`Ảnh mới ${index + 1}`} className="h-full w-full object-cover" />
                          </Button>
                        ) : (
                          <InvalidPhotoPreview />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          disabled={pending || unresolved}
                          aria-label={`Bỏ ảnh mới ${index + 1}`}
                          onClick={() => removeFileAt(index)}
                          style={{ padding: 0 }}
                          className={
                            "absolute top-1 right-1 flex h-5 w-5 shrink-0 items-center justify-center " +
                            "rounded-full bg-foreground/80 text-card shadow-xs transition-colors " +
                            "hover:bg-danger hover:text-card cursor-pointer"
                          }
                        >
                          <svg
                            aria-hidden="true"
                            className="h-3 w-3 shrink-0 text-card"
                            style={{ color: "var(--color-card)" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>

                  {photoField.fieldState.error && (
                    <p role="alert" className="wrap-anywhere text-xs text-danger">{photoField.fieldState.error.message}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={upload.isPending}
                      disabled={pending || unresolved || validatePhotos(files) !== true}
                      onClick={() => void uploadBatch(record, files)}
                      className="h-8 px-4 text-xs font-semibold"
                    >
                      Tải ảnh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Thao tác sau khi đã ghi nhận sự cố */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button
              type="button"
              variant="primary"
              onClick={startNew}
              className="min-h-11 min-w-44 px-8 font-semibold"
            >
              Ghi sự cố mới cho trẻ này
            </Button>
          </div>
        </div>
      ) : (
        /* Form tạo sự cố ban đầu (khi chưa tạo) */
        <form
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => setPendingSubmit(values))(event);
          }}
          className="space-y-3"
          aria-label="Ghi nhận sự cố"
          aria-busy={pending}
        >
          <fieldset disabled={pending || unresolved} className="min-w-0 space-y-3">
            {/* Trường 1: Thời điểm xảy ra */}
            <FormField
              id="incident-time"
              label="Thời điểm xảy ra sự cố"
              required
              hint="Giờ Việt Nam (UTC+7)"
              error={form.formState.errors.occurredAt?.message}
            >
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <Input
                  id="incident-time"
                  type="datetime-local"
                  step={60}
                  className="min-h-11 min-w-0 text-xs sm:text-sm"
                  style={{ paddingInline: "0.75rem" }}
                  aria-describedby="incident-time-hint"
                  aria-invalid={Boolean(form.formState.errors.occurredAt)}
                  error={form.formState.errors.occurredAt?.message}
                  {...form.register("occurredAt", { validate: validateOccurredAt })}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-11 whitespace-nowrap px-3 text-xs"
                  onClick={() =>
                    form.setValue("occurredAt", vietnamDateTime(), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  Vừa xảy ra
                </Button>
              </div>
            </FormField>

            {/* Trường 2: Mô tả sự cố */}
            <FormField
              id="incident-description"
              label="Mô tả chi tiết sự cố"
              required
              hint={`${description?.length ?? 0}/1000 ký tự`}
              error={form.formState.errors.description?.message}
            >
              <Textarea
                id="incident-description"
                rows={3}
                maxLength={1000}
                className="resize-y"
                placeholder={
                  "Mô tả cụ thể sự việc: thời gian, khu vực xảy ra, diễn biến sự cố, " +
                  "biểu hiện/vị trí tổn thương của trẻ (nếu có) và biện pháp sơ cứu/xử " +
                  "lý đã thực hiện..."
                }
                aria-invalid={Boolean(form.formState.errors.description)}
                error={form.formState.errors.description?.message}
                {...form.register("description", { validate: validateNotes })}
              />
            </FormField>

            {/* Trường 3: Ảnh minh chứng (tùy chọn) - Chuẩn hóa FormField đồng nhất với form sức khỏe */}
            <FormField
              id="incident-photos"
              label="Ảnh minh chứng"
              hint={
                files.length > 0
                  ? undefined
                  : "Tùy chọn (tối đa 5 ảnh/lần · JPEG/PNG ≤ 5 MB)"
              }
              error={photoField.fieldState.error?.message}
            >
              {files.length === 0 ? (
                /* Vùng kéo thả ảnh rộng rãi, trực quan với icon và nút thao tác */
                <div
                  role="group"
                  aria-label="Chọn hoặc kéo thả ảnh sự cố"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all select-none",
                    isDragging
                      ? "border-brand bg-brand-subtle/50 ring-2 ring-brand/30"
                      : "border-border/80 bg-background/30 hover:border-brand-border hover:bg-background/60",
                    (pending || unresolved) && "opacity-60 pointer-events-none"
                  )}
                >
                  <div className="pointer-events-none mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-brand">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 " +
                          "20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        }
                      />
                    </svg>
                  </div>
                  <p className="pointer-events-none text-xs font-semibold text-foreground">
                    Kéo thả ảnh vào đây hoặc chọn tệp ảnh
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 gap-1.5 px-3 text-xs"
                      disabled={pending || unresolved}
                      onClick={(e) => {
                        e.stopPropagation();
                        photoInput.current?.click();
                      }}
                    >
                      <svg
                        className="h-3.5 w-3.5 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Chọn tệp ảnh</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 gap-1.5 px-3 text-xs"
                      disabled={pending || unresolved}
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInput.current?.click();
                      }}
                    >
                      <svg
                        className="h-3.5 w-3.5 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 " +
                            "1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          }
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Chụp ảnh</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Preview danh sách ảnh đã chọn gọn gàng */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (previewItems.length < 5) e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (previewItems.length < 5 && e.dataTransfer.files?.length) {
                      addFiles(e.dataTransfer.files);
                    }
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted text-[11px]">
                      Kéo thả thêm ảnh hoặc bấm bỏ bớt nếu cần
                    </span>
                    <Button variant="ghost" size="sm"
                      type="button"
                      disabled={pending || unresolved}
                      onClick={clearFiles}
                      className="text-[11px] font-medium text-muted hover:text-danger cursor-pointer transition-colors"
                    >
                      Bỏ tất cả ({files.length})
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {previewItems.map((item, index) => {
                      const mbSize = (item.file.size / (1024 * 1024)).toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      });
                      const isInvalid = !item.validation.valid;

                      return (
                        <div
                          key={`${index}:${item.file.name}`}
                          className={cn(
                            "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card text-left transition-all",
                            isInvalid
                              ? "border-danger bg-danger-bg/20 ring-1 ring-danger"
                              : "border-border shadow-2xs hover:border-brand-border"
                          )}
                        >
                          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-background">
                            {item.url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                style={{ padding: 0 }}
                                aria-label={`Xem ảnh lớn ${item.file.name}`}
                                title="Bấm để xem ảnh phóng to"
                                onClick={() => setViewingIndex(viewableItems.findIndex((photo) => photo.sourceIndex === index))}
                                className="h-full w-full cursor-zoom-in text-left focus:outline-none"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.url}
                                  alt={`Ảnh đã chọn ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </Button>
                            ) : (
                              <InvalidPhotoPreview />
                            )}
                            <span className={
                              "pointer-events-none absolute top-1 left-1 rounded-full " +
                              "bg-foreground/70 px-1.5 py-0.2 text-[9px] font-semibold text-card"
                            }>
                              {index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              disabled={pending || unresolved}
                              aria-label={`Bỏ ảnh ${index + 1}`}
                              onClick={() => removeFileAt(index)}
                              style={{ padding: 0 }}
                              className={
                                "absolute top-1 right-1 flex h-5 w-5 shrink-0 items-center justify-center " +
                                "rounded-full bg-foreground/80 text-card shadow-xs transition-colors " +
                                "hover:bg-danger hover:text-card cursor-pointer"
                              }
                            >
                              <svg
                                aria-hidden="true"
                                className="h-3 w-3 shrink-0 text-card"
                                style={{ color: "var(--color-card)" }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-1 text-xs">
                            <p
                              className="truncate text-[10px] font-medium text-foreground"
                              title={item.file.name}
                            >
                              {item.file.name}
                            </p>
                            <span className="text-[9px] text-muted block">{mbSize} MB</span>
                            {isInvalid && (
                              <p className="text-[9px] font-medium text-danger leading-tight">
                                {item.validation.error}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Vị trí thêm ảnh nếu chưa đủ 5 ảnh */}
                    {previewItems.length < 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={pending || unresolved}
                        onClick={() => photoInput.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.length) {
                            addFiles(e.dataTransfer.files);
                          }
                        }}
                        className={
                          "group flex h-full min-h-[6rem] w-full flex-col items-center justify-center " +
                          "rounded-lg border border-dashed border-border/80 bg-background/30 p-2 text-center " +
                          "text-muted transition-all hover:border-brand hover:bg-background/70 hover:text-brand " +
                          "cursor-pointer"
                        }
                      >
                        <div
                          className={
                            "mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-subtle " +
                            "text-brand transition-transform group-hover:scale-110"
                          }
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-medium text-foreground">Thêm ảnh</span>
                        <span className="text-[9px] text-muted">{previewItems.length}/5</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </FormField>
          </fieldset>

          {/* Thao tác lưu sự cố */}
          <div className="flex items-center justify-center gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={pending}
              disabled={unresolved}
              className="min-h-11 min-w-44 px-8 font-semibold shrink-0"
            >
              {creation.isPending
                ? "Đang lưu sự cố..."
                : upload.isPending
                ? "Đang tải ảnh lên..."
                : "Lưu sự cố"}
            </Button>
          </div>
        </form>
      )}

      {/* Trường chọn ảnh được mở bằng nút thao tác. */}
      <Input
        id="incident-photos-picker"
        type="file"
        multiple
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        ref={photoInput}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />

      {/* Trường chụp ảnh được mở bằng nút thao tác. */}
      <Input
        id="incident-photos-camera"
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        ref={cameraInput}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingSubmit)}
        title="Xác nhận ghi sự cố"
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
            <div className={
              "max-h-[calc(100dvh-14rem)] min-w-0 space-y-3 overflow-y-auto overscroll-contain pr-1 text-xs " +
              "leading-relaxed text-foreground wrap-anywhere"
            }>
              <div className="rounded-lg bg-brand-subtle px-3 py-2 text-foreground">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">Trẻ: </span>
                  <strong className="font-bold text-foreground">{child.fullName}</strong>
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border/80 bg-background/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Thời điểm xảy ra:</span>
                  <span className="text-foreground">
                    {formatRecordTime(occurredAtUtc(pendingSubmit.occurredAt) || "")}
                  </span>
                </div>
                {pendingSubmit.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Ảnh minh chứng đính kèm:</span>
                    <span className="text-foreground">
                      {pendingSubmit.photos.length} ảnh
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Mô tả sự cố:</span>
                  <p className="whitespace-pre-wrap wrap-anywhere leading-relaxed text-foreground">
                    {pendingSubmit.description}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted">
                Lưu ý: Sau khi lưu, hệ thống sẽ tự động gửi thông báo tới phụ huynh và nhân viên y tế.
                Bản ghi không thể chỉnh sửa hoặc xóa.
              </p>
            </div>
          )
        }
      />

      <ConfirmDialog
        isOpen={confirmEnd}
        title="Kết thúc lượt ghi nhận sự cố?"
        compactHeader={true}
        layout="stacked"
        description={
          unresolved
            ? (
              "Chỉ kết thúc khi bạn đã đối chiếu kết quả với người phụ trách. Thao " +
              "tác này không gửi lại sự cố hoặc ảnh."
            )
            : (
              "Sự cố đã lưu được giữ nguyên trong hệ thống. Những ảnh đang chọn " +
              "nhưng chưa đính kèm sẽ được bỏ khỏi biểu mẫu."
            )
        }
        confirmText={unresolved ? "Đã đối chiếu" : "Kết thúc lượt ghi"}
        cancelText="Quay lại"
        onClose={() => {
          setConfirmEnd(false);
          requestAnimationFrame(() => endTrigger.current?.focus());
        }}
        onConfirm={startNew}
      />

      {viewingIndex !== null && viewableItems[viewingIndex] && (
        <SelectedPhotoModal
          items={viewableItems}
          currentIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
          onSelectIndex={(nextIndex) => setViewingIndex(nextIndex)}
          onRemoveIndex={(targetIndex) => removeFileAt(viewableItems[targetIndex].sourceIndex)}
          disabled={pending || unresolved}
        />
      )}
    </div>
  );
}
