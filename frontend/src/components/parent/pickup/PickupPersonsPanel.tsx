"use client";

import { useState } from "react";
import { SectionCard } from "@/components/parent/health/SectionCard";
import { PickupPersonCard } from "@/components/parent/pickup/PickupPersonCard";
import { PickupPersonModal } from "@/components/parent/pickup/PickupPersonModal";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useDeletePickupPerson, useParentPickupPersons } from "@/hooks/useParentPickupPersons";
import { PICKUP_BACKUP, PICKUP_PRIMARY, type PickupPersonResponse, type PickupPriority } from "@/types/pickup";

const USER_ICON = "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0";
const USERS_ICON = "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";

type ModalState = { person: PickupPersonResponse } | { priority: PickupPriority } | null;

function Badge({ children, tone }: { children: string; tone: "required" | "optional" }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone === "required"
      ? "border-brand-border bg-brand-subtle text-brand-text" : "border-info-border bg-info-bg text-info-text"}`}>
      {children}
    </span>
  );
}

/** Đưa focus về nút sau khi khung đổi từ trạng thái trống sang thẻ thông tin. */
function focusLater(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/**
 * FR-PICKUP-03: hai khung. Người đón chính (bắt buộc, chỉ sửa, không có nút xóa) và người dự phòng
 * (tùy chọn, tối đa 1, chỉ mở khi đã có người chính, được xóa) (D24, D40 mục 1). Thêm/sửa trong popup.
 */
export function PickupPersonsPanel({ childId }: { childId: string }) {
  const persons = useParentPickupPersons(childId);
  const remove = useDeletePickupPerson(childId);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleting, setDeleting] = useState<PickupPersonResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Mất quyền (403/404) thì ẩn hết dữ liệu cũ; lỗi tạm thời vẫn giữ dữ liệu đang xem.
  const hasVisibleData = persons.data !== undefined
    && persons.error?.status !== 403 && persons.error?.status !== 404;
  const list = hasVisibleData ? persons.data ?? [] : [];
  const primary = list.find((person) => person.priority === PICKUP_PRIMARY);
  const backup = list.find((person) => person.priority === PICKUP_BACKUP);

  if (persons.isLoading) {
    return <div role="status"><StatusMessage status="loading" title="Đang tải thông tin người đón…" /></div>;
  }
  if (!hasVisibleData) {
    return (
      <div role="alert">
        <StatusMessage status="error" title="Không thể tải thông tin người đón" message={persons.error?.message}
          onRetry={() => { void persons.refetch(); }} />
      </div>
    );
  }

  const open = (state: NonNullable<ModalState>) => { setNotice(null); setModal(state); };

  const finishSave = () => {
    const edited = modal && "person" in modal ? modal.person : null;
    const role = (edited?.priority ?? (modal && "priority" in modal ? modal.priority : PICKUP_PRIMARY)) === PICKUP_PRIMARY
      ? "chính" : "dự phòng";
    setNotice(`${edited ? "Đã cập nhật" : "Đã lưu"} người đón ${role}.`);
    setModal(null);
    focusLater(role === "chính" ? "pickup-edit-primary" : "pickup-edit-backup");
  };

  const confirmDelete = () => {
    if (!deleting || remove.isPending) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        setNotice("Đã xóa người đón dự phòng.");
        focusLater("pickup-add-backup");
      },
      // 404/409: người này đã bị xóa hoặc đổi ở nơi khác, danh sách đã tải lại nên đóng hộp thoại.
      onError: (error) => { if (error.status === 404 || error.status === 409) setDeleting(null); },
    });
  };

  return (
    <div className="space-y-5" aria-busy={persons.isFetching}>
      {persons.isError && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice className="px-4 py-3 sm:px-5" message={persons.error.message}
            isFetching={persons.isFetching} onRetry={() => { void persons.refetch(); }} />
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3 text-sm font-medium text-brand-text">
          {notice}
        </p>
      )}

      <SectionCard id="pickup-primary-heading" iconPath={USER_ICON} tone="brand" title="Người đón chính"
        aside={<Badge tone="required">Bắt buộc</Badge>}>
        {primary ? (
          <PickupPersonCard childId={childId} person={primary} actions={
            // Người đón chính chỉ được thay thông tin, không có nút xóa.
            <Button id="pickup-edit-primary" variant="outline" onClick={() => open({ person: primary })}>
              Sửa thông tin
            </Button>
          } />
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-5">
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Bé chưa có người đón chính. Hãy đăng ký để nhà trường biết giao bé cho ai.
            </p>
            <Button id="pickup-add-primary" onClick={() => open({ priority: PICKUP_PRIMARY })}>
              Đăng ký người đón chính
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard id="pickup-backup-heading" iconPath={USERS_ICON} tone="info" title="Người đón dự phòng"
        subtitle="Tùy chọn. Tối đa 1 người, dùng khi người đón chính không đến được" aside={<Badge tone="optional">Tùy chọn</Badge>}>
        {!primary ? (
          <p className="px-4 py-6 text-center text-sm text-muted sm:px-5">
            Cần đăng ký người đón chính trước khi thêm người đón dự phòng.
          </p>
        ) : backup ? (
          <PickupPersonCard childId={childId} person={backup} actions={<>
            <Button id="pickup-edit-backup" variant="outline" onClick={() => open({ person: backup })}>
              Sửa thông tin
            </Button>
            <Button variant="secondary" className="border-danger-border text-danger! hover:bg-danger-bg"
              onClick={() => { setNotice(null); remove.reset(); setDeleting(backup); }}>
              Xóa người dự phòng
            </Button>
          </>} />
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-5">
            <p className="text-sm text-muted">Bé chưa có người đón dự phòng.</p>
            <Button id="pickup-add-backup" variant="outline" onClick={() => open({ priority: PICKUP_BACKUP })}>
              Thêm người đón dự phòng
            </Button>
          </div>
        )}
      </SectionCard>

      {modal && (
        <PickupPersonModal
          key={"person" in modal ? modal.person.id : `new-${modal.priority}`}
          childId={childId}
          person={"person" in modal ? modal.person : undefined}
          priority={"priority" in modal ? modal.priority : undefined}
          onClose={() => setModal(null)}
          onSaved={finishSave}
        />
      )}

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Xóa người đón dự phòng?"
        variant="destructive"
        confirmText="Xóa người dự phòng"
        cancelText="Giữ lại"
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => { if (!remove.isPending) setDeleting(null); }}
        description={deleting && (
          <div className="space-y-3 text-sm leading-relaxed text-muted">
            <p>
              <strong className="font-semibold text-foreground [overflow-wrap:anywhere]">{deleting.fullName}</strong> sẽ
              không còn được giao bé khi đón. Thông tin và ảnh khuôn mặt của người này sẽ bị xóa khỏi hệ thống.
            </p>
            {remove.isError && <p role="alert" className="text-danger [overflow-wrap:anywhere]">{remove.error.message}</p>}
          </div>
        )}
      />
    </div>
  );
}
