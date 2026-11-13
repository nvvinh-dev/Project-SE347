"use client";

import { useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SuccessToast, type ToastMessage } from "@/components/accountant/SuccessToast";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChildSelect } from "@/components/parent/ChildSelect";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { ComplaintForm } from "@/components/parent/complaints/ComplaintForm";
import { ComplaintList } from "@/components/parent/complaints/ComplaintList";
import { FormField } from "@/components/ui/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useChildComplaints } from "@/hooks/useComplaints";
import { useMyChildren } from "@/hooks/useMyChildren";
import type { MyChildResponse } from "@/types/children";

function ChildComplaints({ childOptions, onSent }: { childOptions: MyChildResponse[]; onSent: (childName: string) => void }) {
  const { control } = useForm<{ childId: string }>({ defaultValues: { childId: childOptions[0].id } });
  const childId = useWatch({ control, name: "childId" });
  // Nếu liên kết bị gỡ khi tải lại danh sách, không tiếp tục hiển thị trẻ đã bị loại.
  const child = childOptions.find((item) => item.id === childId) ?? childOptions[0];
  const complaints = useChildComplaints(child.id);

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:px-5">
        <div className="w-full min-w-0 sm:max-w-sm">
          <FormField id="complaint-child" label="Chọn con" className="[&_label]:text-sm">
            <Controller
              name="childId"
              control={control}
              render={({ field }) => (
                <ChildSelect {...field} id="complaint-child" value={child.id} options={childOptions} />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* 1024px còn sidebar nên chỉ chia 2 cột từ xl. */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:items-start">
        <ComplaintForm child={child} onSent={onSent} />
        {/* Đổi trẻ thì đặt lại trang của danh sách. */}
        <ComplaintList key={child.id} childName={child.fullName} complaints={complaints} />
      </div>
    </div>
  );
}

export default function ParentComplaintsPage() {
  const children = useMyChildren();
  const records = children.data ?? [];
  const hasVisibleData = children.data !== undefined
    && children.error?.status !== 403 && children.error?.status !== 404;
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Phản ánh" description="Gửi phản ánh về con tới Ban giám hiệu và theo dõi kết quả xử lý" />
      {children.isError && hasVisibleData && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice className="border-b border-warning-border px-4 py-3 sm:px-6" message={children.error.message}
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
          <StatusMessage status="empty" title="Chưa có hồ sơ trẻ được liên kết"
            message="Vui lòng liên hệ nhà trường để liên kết tài khoản với hồ sơ của con." />
        ) : (
          <ChildComplaints
            childOptions={records}
            onSent={(childName) => setToast({ id: Date.now(), text: `Đã gửi phản ánh về bé ${childName} tới Ban giám hiệu.` })}
          />
        )}
      </div>
      <SuccessToast toast={toast} onClose={hideToast} />
    </div>
  );
}
