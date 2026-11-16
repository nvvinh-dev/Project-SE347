"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChildSelect } from "@/components/parent/ChildSelect";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { InvoiceHistory } from "@/components/parent/tuition/InvoiceHistory";
import { FormField } from "@/components/ui/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useMyChildren } from "@/hooks/useMyChildren";
import { useParentInvoices } from "@/hooks/useParentInvoices";
import type { MyChildResponse } from "@/types/children";

function ChildInvoiceViewer({ childOptions }: { childOptions: MyChildResponse[] }) {
  const { control } = useForm<{ childId: string }>({
    defaultValues: { childId: childOptions[0].id },
  });
  const childId = useWatch({ control, name: "childId" });
  // Nếu liên kết bị gỡ khi tải lại danh sách, không tiếp tục hiển thị trẻ đã bị loại.
  const child = childOptions.find((item) => item.id === childId) ?? childOptions[0];
  const invoices = useParentInvoices(child.id);

  return (
    <section aria-labelledby="invoice-heading" className="min-w-0 rounded-2xl border border-border bg-card shadow-xs">
      <h2 id="invoice-heading" className="sr-only">Hóa đơn học phí của {child.fullName}</h2>
      <div className="border-b border-border p-4 sm:px-6 sm:py-5">
        <div className="w-full min-w-0 sm:max-w-sm">
          <FormField id="invoice-child" label="Chọn con" className="[&_label]:text-sm">
            <Controller
              name="childId"
              control={control}
              render={({ field }) => (
                <ChildSelect {...field} id="invoice-child" value={child.id} options={childOptions} />
              )}
            />
          </FormField>
        </div>
      </div>
      <div className="overflow-hidden rounded-b-2xl">
        {/* Chỉ đặt lại phần danh sách khi đổi trẻ để ô chọn vẫn giữ focus. */}
        <InvoiceHistory key={child.id} invoices={invoices} />
      </div>
    </section>
  );
}

export default function ParentTuitionPage() {
  const children = useMyChildren();
  const records = children.data ?? [];
  const hasVisibleData = children.data !== undefined
    && children.error?.status !== 403 && children.error?.status !== 404;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Thông tin học phí"
        description="Xem hóa đơn học phí và trạng thái thanh toán của bé"
      />
      {/* D21: phụ huynh không thanh toán trên hệ thống; chỉ xem, Kế toán ghi nhận sau khi nhận tiền. */}
      <p className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3 text-sm text-brand-text">
        Phụ huynh nộp học phí bằng tiền mặt tại trường hoặc chuyển khoản vào tài khoản của nhà trường.
        Trạng thái hóa đơn sẽ chuyển sang{" "}
        <strong className="font-semibold">Đã thanh toán</strong>{" "}
        sau khi nhà trường ghi nhận khoản đã nộp.
      </p>
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
          <ChildInvoiceViewer childOptions={records} />
        )}
      </div>
    </div>
  );
}
