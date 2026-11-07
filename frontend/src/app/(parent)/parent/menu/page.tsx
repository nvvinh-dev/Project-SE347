"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuWeekPicker } from "@/components/parent/menu/MenuWeekPicker";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { WeeklyMenuView } from "@/components/parent/menu/WeeklyMenuView";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useWeeklyMenu } from "@/hooks/useWeeklyMenu";
import { currentMenuWeek } from "@/lib/menu";

export default function ParentMenuPage() {
  const [week, setWeek] = useState(currentMenuWeek);
  const menu = useWeeklyMenu(week);
  const hasCachedData = menu.data !== undefined && menu.error?.status !== 403;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Thực đơn tuần" description="Các bữa ăn trong tuần của nhà trường" />
      <MenuWeekPicker week={week} onWeekChange={setWeek} />
      {menu.isError && hasCachedData && (
        <RefreshErrorNotice className="rounded-xl border border-warning-border p-4" title="Không tải lại được thực đơn tuần."
          message={menu.error.message} isFetching={menu.isFetching} onRetry={() => { void menu.refetch(); }} />
      )}
      {menu.isLoading ? (
        <div role="status"><StatusMessage status="loading" title="Đang tải thực đơn tuần…" /></div>
      ) : menu.isError && !hasCachedData ? (
        <div role="alert"><StatusMessage status="error" title="Không thể tải thực đơn tuần" message={menu.error.message}
          action={<Button variant="secondary" size="sm" disabled={menu.isFetching} onClick={() => { void menu.refetch(); }}>Thử lại</Button>} /></div>
      ) : menu.data !== undefined ? (
        menu.data && menu.data.entries.length > 0
          ? <WeeklyMenuView week={week} entries={menu.data.entries} />
          : <div role="status"><StatusMessage status="empty" title="Chưa có thực đơn cho tuần này." message="Bạn có thể chọn tuần khác để xem thực đơn." /></div>
      ) : null}
    </div>
  );
}
