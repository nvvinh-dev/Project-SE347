"use client";

import { useEffect, useRef, useState } from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { cn } from "@/lib/utils";
import { isUncertainWrite, validatePhotos } from "../incidents/_lib/health-incidents";
import MediaPhotoPicker from "./MediaPhotoPicker";
import ShareFeedback from "./ShareFeedback";
import ShareResultPanel, { type ShareResult } from "./ShareResultPanel";
import { getHomeroomClasses, shareActivityPhotos, type SharedPhoto } from "./_lib/activity-photos";

interface Fields {
  classId: string;
  photos: File[];
}

export default function MediaScreen() {
  const { user } = useAuth();
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
  const showForm = classes.isSuccess && classes.data.length > 0;

  // Chọn sẵn khi giáo viên chỉ phụ trách một lớp để giảm bớt thao tác.
  useEffect(() => {
    if (classes.data?.length === 1) {
      form.setValue("classId", classes.data[0].id);
    }
  }, [classes.data, form]);

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

  const confirmShare = () => {
    if (sending.current) return;
    sending.current = true;
    share.reset();
    share.mutate({ ...form.getValues(), className });
  };

  return (
    // Thanh chia sẻ cố định ở đáy điện thoại, chừa chỗ để không che phần cuối trang (kể cả khối kết quả).
    <div className={cn("w-full min-w-0 space-y-5", showForm && "pb-20 lg:pb-0")}>
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
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          <div className="border-b border-border bg-card p-4 sm:p-5">
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

          {/* Chỉ chia hai cột từ xl: ở lg khu vực sidebar đã chiếm chỗ, chia tiếp sẽ làm ảnh xem trước quá nhỏ. */}
          <div
            className={cn(
              "min-w-0 p-4 sm:p-6",
              hasSelectedClass ? "grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]" : "space-y-6"
            )}
          >
            {hasSelectedClass && (
              <div className="min-w-0 space-y-4 xl:border-r xl:border-border xl:pr-6">
                <div className="min-w-0 space-y-3 rounded-xl border border-border/80 bg-background/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Thông tin chia sẻ
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                      <span className="shrink-0 text-muted">Lớp nhận ảnh:</span>
                      <span
                        className="truncate break-words font-semibold text-foreground [overflow-wrap:anywhere]"
                        title={className}
                      >
                        {className}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-baseline justify-between gap-2">
                      <span className="shrink-0 text-muted">Đối tượng xem:</span>
                      <span className="font-semibold text-foreground">Phụ huynh của lớp</span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-success-border/60 bg-success-bg/40 p-3.5 text-xs leading-relaxed text-success">
                  Ảnh sau khi đăng sẽ gửi thông báo đến phụ huynh có con học trong lớp đã chọn.
                </div>
              </div>
            )}

            <div className="min-w-0 space-y-4">
              <MediaPhotoPicker
                files={files}
                error={form.formState.errors.photos?.message}
                disabled={share.isPending}
                onChange={updatePhotos}
              />

              {share.isError && <ShareFeedback error={share.error} uncertain={uncertain} />}

              {/* Dưới lg cố định ở đáy màn hình để luôn với tới được; từ lg nằm ngay dưới khung ảnh. */}
              <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-end border-t border-border bg-card/95 p-3.5 backdrop-blur-xs lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:pt-1">
                <Button
                  type="submit"
                  className="min-h-11 w-full font-semibold shadow-xs sm:w-auto sm:min-w-40"
                  isLoading={share.isPending}
                >
                  {share.isPending ? "Đang chia sẻ..." : "Chia sẻ ảnh"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {result && <ShareResultPanel result={result} />}

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
            <p className="text-xs leading-relaxed text-muted">
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
