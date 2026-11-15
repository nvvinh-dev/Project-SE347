"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { cn } from "@/lib/utils";
import InvalidPhotoPreview from "../incidents/InvalidPhotoPreview";
import {
  formatRecordTime,
  isUncertainWrite,
  validatePhotos,
  validateSinglePhoto,
} from "../incidents/_lib/health-incidents";
import { getHomeroomClasses, shareActivityPhotos, type SharedPhoto } from "./_lib/activity-photos";

interface Fields {
  classId: string;
  photos: File[];
}

interface ShareResult {
  className: string;
  photos: SharedPhoto[];
}

const PICKER_ID = "media-photos-picker";

export default function MediaScreen() {
  const { user } = useAuth();
  const picker = useRef<HTMLInputElement>(null);
  // Khóa đồng bộ chống chạm hai lần liên tiếp khi gửi dữ liệu multipart.
  const sending = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);

  const classes = useApiQuery({
    queryKey: ["teacher-homeroom-classes", user?.userId],
    queryFn: ({ signal }) => getHomeroomClasses(signal),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const form = useForm<Fields>({
    defaultValues: { classId: "", photos: [] },
  });

  const classId = useWatch({ control: form.control, name: "classId" });
  const photoField = useController({
    control: form.control,
    name: "photos",
    rules: {
      validate: (files) =>
        files.length ? validatePhotos(files) : "Vui lòng chọn ít nhất 1 ảnh để chia sẻ.",
    },
  });

  const files = photoField.field.value;
  const className = classes.data?.find((item) => item.id === classId)?.name ?? "";
  const hasSelectedClass = Boolean(classId);

  // Chặn trình duyệt tự động mở tệp ảnh khi người dùng kéo thả ngoài vùng cho phép.
  useEffect(() => {
    const preventOutsideDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventOutsideDrop);
    window.addEventListener("drop", preventOutsideDrop);
    return () => {
      window.removeEventListener("dragover", preventOutsideDrop);
      window.removeEventListener("drop", preventOutsideDrop);
    };
  }, []);

  // Chọn sẵn khi giáo viên chỉ phụ trách một lớp học duy nhất để giảm bớt thao tác.
  useEffect(() => {
    if (classes.data?.length === 1) {
      form.setValue("classId", classes.data[0].id);
    }
  }, [classes.data, form]);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: validateSinglePhoto(file).valid ? URL.createObjectURL(file) : null,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previews]);

  const share = useApiMutation<SharedPhoto[], Fields & { className: string }>({
    // Không tự động thử lại vì một lượt tải lên có thể đã ghi nhận và phát thông báo phụ huynh.
    retry: false,
    mutationFn: ({ classId: id, photos }) => shareActivityPhotos(id, photos),
    onSuccess: (photos, variables) => {
      setResult({ className: variables.className, photos });
      setUncertain(false);
      form.reset({ classId: variables.classId, photos: [] });
    },
    onError: (error) => {
      setUncertain(isUncertainWrite(error));
      if (error.status === 404) {
        form.setValue("classId", "");
        void classes.refetch();
      }
    },
    onSettled: () => {
      sending.current = false;
      setConfirming(false);
    },
  });

  const updatePhotos = (next: File[]) => {
    form.setValue("photos", next, { shouldValidate: true, shouldDirty: true });
  };

  const addFiles = (list: FileList | null) => {
    if (list?.length) {
      updatePhotos([...files, ...Array.from(list)]);
    }
    // Cho phép người dùng chọn lại tệp cùng tên vừa xóa.
    if (picker.current) picker.current.value = "";
  };

  const confirmShare = () => {
    if (sending.current) return;
    sending.current = true;
    share.reset();
    share.mutate({ ...form.getValues(), className });
  };

  const backendErrors =
    share.error?.errors?.filter((item) => item && item !== share.error?.message) ?? [];

  return (
    <div className="space-y-5 min-w-0 w-full">
      <PageHeader
        title="Ảnh hoạt động lớp"
        description="Chia sẻ ảnh hoạt động cho lớp mình phụ trách"
      />

      {classes.isPending ? (
        <StatusMessage status="loading" title="Đang tải danh sách lớp..." />
      ) : classes.isError ? (
        <StatusMessage
          status="error"
          title="Không tải được danh sách lớp"
          message={classes.error.message}
          onRetry={() => void classes.refetch()}
        />
      ) : classes.data.length === 0 ? (
        <StatusMessage
          status="empty"
          title="Chưa có lớp để chia sẻ ảnh"
          message="Tài khoản của bạn chưa phụ trách lớp nào nên chưa thể chia sẻ ảnh hoạt động."
        />
      ) : (
        <form
          noValidate
          onSubmit={form.handleSubmit(() => setConfirming(true))}
          className="min-w-0 rounded-xl border border-border bg-card shadow-xs overflow-hidden"
        >
          {/* Thanh chọn lớp trải dài ngang toàn màn hình với đường kẻ mờ phân cách border-b border-border chuẩn đồng nhất */}
          <div className="border-b border-border p-4 sm:p-5 bg-card">
            <FormField
              id="media-class"
              label="Lớp chia sẻ"
              required
              error={form.formState.errors.classId?.message}
              className="w-full min-w-0"
            >
              <Select
                id="media-class"
                placeholder="Chọn lớp"
                options={classes.data.map((item) => ({ value: item.id, label: item.name }))}
                disabled={share.isPending}
                error={form.formState.errors.classId?.message}
                className="min-h-11 w-full"
                {...form.register("classId", { required: "Vui lòng chọn lớp để chia sẻ ảnh." })}
              />
            </FormField>
          </div>

          {/* Phần thân bên dưới đường phân cách ngang:
              - Khi chưa chọn lớp: Không hiển thị thông tin chia sẻ, khu vực Ảnh hoạt động full-width.
              - Khi đã chọn lớp: Chia đôi 2 cột như Ảnh 2 (cột trái: thông tin chia sẻ + thông báo xanh; cột phải: ảnh hoạt động). */}
          <div
            className={cn(
              "p-4 sm:p-6 pb-20 sm:pb-24 lg:pb-6 min-w-0",
              hasSelectedClass
                ? "grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"
                : "space-y-6"
            )}
          >
            {/* Cột thông tin chia sẻ bên trái — chỉ hiển thị khi đã chọn lớp cụ thể */}
            {hasSelectedClass && (
              <div className="space-y-4 min-w-0 lg:border-r lg:border-border lg:pr-6">
                <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Thông tin chia sẻ
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                      <span className="text-muted shrink-0">Lớp nhận ảnh:</span>
                      <span
                        className="font-semibold text-foreground truncate break-words [overflow-wrap:anywhere]"
                        title={className}
                      >
                        {className}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                      <span className="text-muted shrink-0">Đối tượng xem:</span>
                      <span className="font-semibold text-foreground">Phụ huynh của lớp</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-success-border/60 bg-success-bg/40 p-3.5 text-xs text-success leading-relaxed min-w-0">
                  Ảnh sau khi đăng sẽ gửi thông báo đến phụ huynh có con học trong lớp đã chọn.
                </div>
              </div>
            )}

            {/* Cột tải ảnh hoạt động bên phải */}
            <div className="space-y-4 min-w-0">
              <div className="space-y-3 min-w-0">
                <FormField
                  id={PICKER_ID}
                  error={form.formState.errors.photos?.message}
                >
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <label htmlFor={PICKER_ID} className="text-xs font-semibold text-foreground">
                        <span className="mr-1 text-danger">*</span>
                        Ảnh hoạt động
                      </label>
                      {files.length > 0 && (
                        <span
                          className="text-xs text-muted break-words [overflow-wrap:anywhere]"
                          aria-live="polite"
                        >
                          (Đã chọn {files.length}/5 ảnh)
                        </span>
                      )}
                    </div>

                    {files.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={share.isPending}
                        onClick={() => updatePhotos([])}
                        className="text-xs text-muted hover:text-danger shrink-0 p-0 h-auto"
                      >
                        Bỏ tất cả
                      </Button>
                    ) : (
                      <span
                        className="text-xs text-muted break-words [overflow-wrap:anywhere]"
                        aria-live="polite"
                      >
                        Đã chọn 0/5 ảnh
                      </span>
                    )}
                  </div>
                </FormField>

                {/* Vùng kéo thả hoặc bấm tải ảnh luôn có class 'rounded-xl transition-colors' để nhận file kéo thả */}
                <div
                  role="region"
                  aria-label="Khu vực tải ảnh"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!share.isPending && e.dataTransfer.files?.length) {
                      addFiles(e.dataTransfer.files);
                    }
                  }}
                  className={cn(
                    "rounded-xl transition-colors min-w-0",
                    files.length > 0 && "rounded-2xl border-2 border-dashed border-border/80 bg-background/25 p-4 sm:p-5"
                  )}
                >
                  {files.length === 0 ? (
                    /* Khung nét đứt khi chưa chọn ảnh: icon, hướng dẫn và nút Chọn ảnh ở chính giữa */
                    <div
                      className={cn(
                        "group relative flex min-h-[250px] sm:min-h-[270px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-all",
                        photoField.fieldState.error
                          ? "border-danger-border bg-danger-bg/10 ring-1 ring-danger-border"
                          : "border-border bg-background/30 hover:border-brand hover:bg-brand-subtle/10"
                      )}
                    >
                      <div className="mb-3.5 flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-subtle text-brand transition-transform group-hover:scale-105 shadow-2xs">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-foreground mb-1.5">
                        Kéo ảnh vào đây hoặc chọn từ thiết bị
                      </p>
                      <p className="text-xs text-muted mb-4 font-normal">
                        JPEG hoặc PNG, tối đa 5 ảnh, mỗi ảnh ≤ 5 MB
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-10 px-6 text-xs sm:text-sm font-medium border-brand-border text-brand-text hover:bg-brand-subtle cursor-pointer shadow-2xs"
                        disabled={share.isPending}
                        onClick={() => picker.current?.click()}
                      >
                        Chọn ảnh
                      </Button>
                    </div>
                  ) : (
                    /* Lưới ảnh xem trước trong khung kéo thả, căn chỉnh vuông vắn và đồng đều */
                    <div className="space-y-3.5 min-w-0">
                      <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-border/50">
                        <span className="text-[11px] sm:text-xs">
                          Kéo thêm ảnh vào khung hoặc bấm ô &quot;Thêm ảnh&quot; bên dưới
                        </span>
                        <span className="text-[11px] text-muted-light shrink-0">
                          Tối đa 5 ảnh (≤ 5 MB)
                        </span>
                      </div>

                      <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-5 min-w-0">
                        {previews.map((item, index) => (
                          <li key={item.url ?? `${item.file.name}-${index}`} className="min-w-0 flex flex-col">
                            <div
                              className={cn(
                                "relative aspect-square w-full overflow-hidden rounded-xl border bg-card shadow-2xs transition-all",
                                !item.url
                                  ? "border-danger ring-1 ring-danger"
                                  : "border-border hover:border-brand-border"
                              )}
                            >
                              {item.url ? (
                                <SignedImage
                                  key={item.url}
                                  src={item.url}
                                  alt={`Ảnh đã chọn ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <InvalidPhotoPreview />
                              )}

                              {/* Thứ tự ảnh */}
                              <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-foreground/75 px-1.5 py-0.5 text-[10px] font-bold text-card backdrop-blur-xs">
                                {index + 1}
                              </span>

                              {/* Nút bỏ ảnh với vùng chạm tối thiểu 44px trên thiết bị di động */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -right-1 -top-1 h-11 w-11 min-h-11 min-w-11 p-0 flex items-center justify-center bg-transparent hover:bg-transparent border-0 cursor-pointer z-10"
                                aria-label={`Bỏ ảnh thứ ${index + 1}`}
                                disabled={share.isPending}
                                onClick={() => updatePhotos(files.filter((_, i) => i !== index))}
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 hover:bg-danger text-card shadow-xs transition-colors">
                                  <svg
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </span>
                              </Button>
                            </div>
                            <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1 text-xs">
                              <p className="min-w-0 flex-1 truncate font-medium text-foreground text-[11px]" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <span className="shrink-0 text-[10px] text-muted">
                                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </div>
                          </li>
                        ))}

                        {/* Vị trí thêm ảnh nhanh: Cùng cấu trúc vuông aspect-square */}
                        {files.length < 5 && (
                          <li className="min-w-0 flex flex-col">
                            <Button
                              variant="ghost"
                              disabled={share.isPending}
                              onClick={() => picker.current?.click()}
                              className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/60 hover:border-brand hover:bg-brand-subtle/20 cursor-pointer transition-all p-2 text-center shadow-2xs"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-subtle text-brand mb-1 shadow-2xs">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-foreground">Thêm ảnh</span>
                            </Button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Thông báo lỗi và cảnh báo bất định */}
                {share.isError && (
                  uncertain ? (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning shadow-xs"
                    >
                      <svg
                        className="h-5 w-5 shrink-0 mt-0.5 text-warning"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-warning">Chưa xác định được kết quả chia sẻ</p>
                        <p className="mt-1 leading-relaxed text-foreground/80">
                          Kết nối bị gián đoạn hoặc máy chủ chưa phản hồi. Ảnh có thể đã được chia sẻ và phụ huynh có thể đã nhận
                          thông báo. Hệ thống không tự gửi lại; chỉ chia sẻ lại khi bạn chắc chắn ảnh chưa được đăng.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger shadow-xs"
                    >
                      <svg
                        className="h-5 w-5 shrink-0 mt-0.5 text-danger"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-danger">{share.error.message}</p>
                        {backendErrors.length > 0 && (
                          <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-foreground/80">
                            {backendErrors.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Nút chia sẻ ảnh: Cố định dưới đáy màn hình trên Mobile, đặt sát dưới khung ảnh ở Desktop */}
              <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end border-t border-border bg-card/95 p-3.5 backdrop-blur-xs lg:static lg:p-0 lg:border-0 lg:bg-transparent lg:pt-1">
                <Button
                  type="submit"
                  className="min-h-11 w-full sm:w-auto sm:min-w-40 font-semibold shadow-xs"
                  isLoading={share.isPending}
                >
                  {share.isPending ? "Đang chia sẻ..." : "Chia sẻ ảnh"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Kết quả sau khi chia sẻ thành công */}
      {result && (
        <section
          role="status"
          className="space-y-4 rounded-xl border border-success-border bg-card p-4 shadow-xs sm:p-6 min-w-0"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-bg text-success border border-success-border">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-success break-words [overflow-wrap:anywhere]">
                Đã chia sẻ {result.photos.length} ảnh cho {result.className}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Lúc {formatRecordTime(result.photos[0].uploadedAtUtc)}. Liên kết xem ảnh có hiệu lực trong 60 phút.
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-5 min-w-0">
            {result.photos.map((photo, index) => (
              <li
                key={photo.id}
                className="aspect-square overflow-hidden rounded-xl border border-border bg-background shadow-2xs min-w-0"
              >
                <SignedImage
                  src={photo.url}
                  alt={`Ảnh đã chia sẻ ${index + 1}`}
                  fallbackText="Ảnh không còn xem được"
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Trường chọn tệp ẩn hoàn toàn khỏi luồng hiển thị mà vẫn giữ tương thích ref và bàn phím */}
      <div className="sr-only" aria-hidden="true">
        <Input
          id={PICKER_ID}
          type="file"
          multiple
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          ref={picker}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      <ConfirmDialog
        isOpen={confirming}
        title="Xác nhận chia sẻ ảnh hoạt động"
        compactHeader={true}
        layout="stacked"
        description={
          <div className="space-y-3 text-left">
            <div className="rounded-lg bg-brand-subtle px-3.5 py-2.5 text-foreground">
              <p className="text-sm">
                Chia sẻ <strong className="font-semibold">{files.length} ảnh</strong> cho{" "}
                <strong className="font-semibold text-foreground">{className}</strong>?
              </p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Ảnh đã chia sẻ không thể sửa hoặc xóa. Phụ huynh của trẻ trong lớp sẽ nhận thông báo.
            </p>
            {uncertain && (
              <p className="rounded-lg border border-warning-border bg-warning-bg p-2.5 text-xs font-medium text-warning">
                Lượt chia sẻ trước chưa xác định được kết quả, ảnh có thể đã được đăng.
              </p>
            )}
          </div>
        }
        confirmText="Chia sẻ"
        cancelText="Hủy bỏ"
        isLoading={share.isPending}
        onConfirm={confirmShare}
        onClose={() => !share.isPending && setConfirming(false)}
      />
    </div>
  );
}
