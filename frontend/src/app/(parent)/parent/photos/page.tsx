"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChildSelect } from "@/components/parent/ChildSelect";
import { ActivityPhotoGallery } from "@/components/parent/photos/ActivityPhotoGallery";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { FormField } from "@/components/ui/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useMyChildren } from "@/hooks/useMyChildren";
import type { MyChildResponse } from "@/types/children";

function ChildPhotoViewer({ childOptions }: { childOptions: MyChildResponse[] }) {
  const { control } = useForm<{ childId: string }>({
    defaultValues: { childId: childOptions[0].id },
  });
  const childId = useWatch({ control, name: "childId" });
  // Nếu liên kết bị gỡ khi tải lại danh sách, không tiếp tục hiển thị trẻ đã bị loại.
  const child = childOptions.find((item) => item.id === childId) ?? childOptions[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:px-6 sm:py-5">
        <div className="w-full min-w-0 sm:max-w-sm">
          <FormField id="photos-child" label="Chọn con" className="[&_label]:text-sm">
            <Controller
              name="childId"
              control={control}
              render={({ field }) => (
                <ChildSelect {...field} id="photos-child" value={child.id} options={childOptions} />
              )}
            />
          </FormField>
        </div>
      </div>
      {/* Đổi trẻ thì dựng lại để về trang 1 và bỏ ảnh đang mở; ô chọn con vẫn giữ focus. */}
      <ActivityPhotoGallery key={child.id} childId={child.id} />
    </div>
  );
}

export default function ParentPhotosPage() {
  const children = useMyChildren();
  const records = children.data ?? [];
  const hasVisibleData = children.data !== undefined
    && children.error?.status !== 403 && children.error?.status !== 404;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Kho ảnh hoạt động"
        description="Hình ảnh sinh hoạt, vui chơi và học tập của bé được giáo viên ghi lại"
      />
      {children.isError && hasVisibleData && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice className="px-4 py-3 sm:px-6" message={children.error.message}
            isFetching={children.isFetching} onRetry={() => { void children.refetch(); }} />
        </div>
      )}
      <div aria-busy={children.isFetching}>
        {children.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải danh sách con…" /></div>
        ) : children.isError && !hasVisibleData ? (
          <div role="alert">
            <StatusMessage status="error" title="Không thể tải danh sách con" message={children.error.message}
              onRetry={() => { void children.refetch(); }} />
          </div>
        ) : records.length === 0 ? (
          <StatusMessage
            status="empty"
            title="Chưa có hồ sơ trẻ được liên kết"
            message="Vui lòng liên hệ nhà trường để liên kết tài khoản với hồ sơ của con."
          />
        ) : (
          <ChildPhotoViewer childOptions={records} />
        )}
      </div>
    </div>
  );
}
