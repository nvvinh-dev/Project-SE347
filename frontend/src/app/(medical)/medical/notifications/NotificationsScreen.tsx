"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useNotifications } from "@/hooks/useNotifications";
import { formatIncidentNotification } from "./_lib/formatIncidentNotification";

const timeFormatter = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

interface InboxFormValues { search: string; receivedDate: string }

function localDay(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function searchable(value: string) {
  return value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function NotificationsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const selectedId = searchParams.get("notificationId");
  const [lookupId, setLookupId] = useState(selectedId);
  const detailRef = useRef<HTMLElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const { control, register, setValue } = useForm<InboxFormValues>({
    defaultValues: { search: "", receivedDate: "" },
  });
  const search = useWatch({ control, name: "search" }) ?? "";
  const receivedDate = useWatch({ control, name: "receivedDate" }) ?? "";
  const searchField = register("search");
  const dateField = register("receivedDate");
  const query = useNotifications({ page: currentPage, pageSize: 20 });
  const data = query.data;
  const dateOptions = useMemo(() => {
    const days = new Map<string, string>();
    for (const item of data?.items ?? []) days.set(localDay(item.createdAtUtc), dayFormatter.format(new Date(item.createdAtUtc)));
    // Giữ ngày đang lọc khi danh sách được làm mới để lựa chọn không hiển thị sai.
    if (receivedDate && !days.has(receivedDate)) days.set(receivedDate, receivedDate.split("-").reverse().join("/"));
    return Array.from(days, ([value, label]) => ({ value, label }));
  }, [data?.items, receivedDate]);
  const filteredItems = useMemo(() => {
    const term = searchable(search.trim());
    return (data?.items ?? []).filter((item) => (!term || searchable(item.message).includes(term)) &&
      (!receivedDate || localDay(item.createdAtUtc) === receivedDate));
  }, [data?.items, search, receivedDate]);
  const selected = data?.items.find((item) => item.id === selectedId);
  const selectedFields = selected ? formatIncidentNotification(selected.message) : null;
  const hasFilters = Boolean(search.trim() || receivedDate);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  useEffect(() => {
    if (selectedId === lookupId) return;
    const frame = requestAnimationFrame(() => {
      setLookupId(selectedId);
      setCurrentPage(1);
      setValue("search", "");
      setValue("receivedDate", "");
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, lookupId, setValue]);

  // Liên kết cũ có thể trỏ tới thông báo đã bị đẩy sang trang sau bởi sự cố mới.
  useEffect(() => {
    if (!lookupId || lookupId !== selectedId || selected || !data || query.isFetching || query.isError || currentPage >= totalPages) return;
    const frame = requestAnimationFrame(() => setCurrentPage((page) => page + 1));
    return () => cancelAnimationFrame(frame);
  }, [lookupId, selectedId, selected, data, query.isFetching, query.isError, currentPage, totalPages]);

  function selectNotification(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("notificationId", id);
    else url.searchParams.delete("notificationId");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setLookupId(id);
  }

  function clearFilters() {
    setValue("search", "");
    setValue("receivedDate", "");
    selectNotification(null);
  }
  function changePage(page: number) {
    setCurrentPage(page);
    clearFilters();
  }
  function closeDetail() {
    selectNotification(null);
    requestAnimationFrame(() => selectedButtonRef.current?.focus());
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <PageHeader title="Hộp thư sự cố" description={data
        ? `Tổng số: ${data.totalCount} thông báo · Sắp xếp mới nhất trước`
        : "Thông báo nhận khi giáo viên ghi nhận sự cố mới của trẻ"}>
        <Button variant="secondary" size="sm" className="min-h-10" disabled={query.isFetching}
          onClick={() => { void query.refetch(); }}>{query.isFetching ? "Đang tải..." : "Tải lại"}</Button>
      </PageHeader>

      <section aria-label="Tìm và lọc thông báo" className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <form onSubmit={(event) => event.preventDefault()} className="grid min-w-0 grid-cols-[minmax(0,1fr)_8.5rem] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,15rem)_auto]">
          <FormField id="inbox-search" label="Tìm thông báo" className="min-w-0">
            <Input id="inbox-search" type="search" className="min-h-10" placeholder="Tìm..."
              {...searchField} onChange={(event) => { void searchField.onChange(event); selectNotification(null); }} />
          </FormField>
          <FormField id="inbox-date" label="Ngày nhận" className="min-w-0">
            <Select id="inbox-date" className="min-h-10 pl-2! pr-8! sm:pl-3.5! sm:pr-10!" placeholder="Tất cả các ngày" options={dateOptions}
              {...dateField} onChange={(event) => { void dateField.onChange(event); selectNotification(null); }} />
          </FormField>
          <Button variant="ghost" className="col-span-2 min-h-10 justify-self-end sm:col-span-1" disabled={!hasFilters} onClick={clearFilters}>Xóa bộ lọc</Button>
        </form>
      </section>

      {query.isLoading ? <StatusMessage status="loading" title="Đang tải danh sách thông báo..." />
        : query.isError && !data ? <StatusMessage status="error" title="Không thể tải danh sách thông báo" message={query.error.message} onRetry={() => { void query.refetch(); }} />
        : data && (
          <>
            {query.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger">
              <p className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">Chưa thể làm mới danh sách thông báo: {query.error.message}</p>
              <Button variant="secondary" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Thử lại</Button>
            </div>}

            {selectedId && !selected && !query.isError && <StatusMessage
              status={lookupId === selectedId && (query.isFetching || currentPage < totalPages) ? "loading" : "empty"}
              title={lookupId === selectedId && (query.isFetching || currentPage < totalPages) ? "Đang tìm thông báo được liên kết..." : "Không tìm thấy thông báo được liên kết"}
              message="Thông báo có thể đã không còn trong danh sách. Bạn có thể quay lại hộp thư."
              action={<Button variant="secondary" onClick={closeDetail}>Về hộp thư</Button>} />}

            <div className={`grid min-w-0 items-start gap-4 lg:gap-5 ${selected ? "lg:grid-cols-[minmax(0,21fr)_minmax(0,29fr)]" : ""}`}>
              <section aria-label="Danh sách thông báo sự cố" className={`min-w-0 space-y-3 ${selected ? "hidden lg:block lg:h-[max(32rem,calc(100dvh-17rem))] lg:overflow-y-auto" : ""}`}>
                {data.items.length === 0 ? <StatusMessage status="empty" title={data.totalCount === 0 ? "Chưa có thông báo sự cố" : "Trang này không còn thông báo"}
                  message={data.totalCount === 0 ? "Thông báo sẽ xuất hiện khi giáo viên ghi nhận một sự cố mới." : "Danh sách đã thay đổi. Vui lòng quay về trang đầu."}
                  action={currentPage > 1 ? <Button variant="secondary" onClick={() => changePage(1)}>Về trang đầu</Button> : undefined} />
                  : filteredItems.length === 0 ? <StatusMessage status="empty" title="Không có thông báo phù hợp" message="Thử từ khóa hoặc ngày nhận khác trong trang này."
                    action={<Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>} />
                  : <>
                    {hasFilters && <p className="text-xs text-muted" aria-live="polite">{filteredItems.length} thông báo phù hợp</p>}
                    <ol className="grid min-w-0 gap-2.5">
                      {filteredItems.map((item) => {
                        return <li key={item.id}>
                        <article className="min-w-0">
                          <Button variant="ghost" className={`w-full min-w-0 items-start rounded-xl border px-4! py-3! text-left shadow-xs active:bg-card focus:ring-0! focus-visible:ring-2! focus-visible:ring-border-hover ${selectedId === item.id
                            ? "border-muted-light bg-background hover:border-muted-light hover:bg-background"
                            : "border-border bg-card hover:border-border-hover hover:bg-background"}`}
                            data-notification-id={item.id} aria-pressed={selectedId === item.id}
                            onClick={(event) => {
                              selectedButtonRef.current = event.currentTarget;
                              selectNotification(item.id);
                              requestAnimationFrame(() => {
                                const detail = detailRef.current;
                                detail?.focus({ preventScroll: true });
                                if (window.innerWidth < 1024) detail?.scrollIntoView({ block: "start" });
                              });
                            }}>
                            <span className="block w-full min-w-0 space-y-2">
                              <span className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                <span className="flex min-w-0 flex-[1_1_8rem] items-start gap-2">
                                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
                                  </span>
                                  <span className="min-w-0 break-words pt-1 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">Thông báo sự cố</span>
                                </span>
                                <span className="pt-1 text-xs font-normal text-muted">Nhận lúc <time dateTime={item.createdAtUtc}>{timeFormatter.format(new Date(item.createdAtUtc))} - {dayFormatter.format(new Date(item.createdAtUtc))}</time></span>
                              </span>
                              <span className="line-clamp-2 whitespace-pre-wrap break-words text-sm font-normal leading-relaxed text-foreground [overflow-wrap:anywhere]">{item.message}</span>
                            </span>
                          </Button>
                        </article>
                      </li>; })}
                    </ol>
                  </>}

                <div className="max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
                  <div className="flex w-full min-w-max items-center justify-between gap-3 py-2 text-xs text-muted">
                    <span className="shrink-0 whitespace-nowrap">Trang {data.page} / {totalPages}</span>
                    <Pagination className="shrink-0 flex-nowrap! justify-end! gap-0 py-0!" page={data.page} pageSize={data.pageSize}
                      totalCount={data.totalCount} showSummary={false} onPageChange={changePage} />
                  </div>
                </div>
              </section>

              {selected && <section ref={detailRef} tabIndex={-1} aria-label="Chi tiết thông báo" data-testid="notification-detail"
                className="flex h-[calc(100dvh-6rem)] min-h-64 min-w-0 scroll-mt-20 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-brand/30 lg:scroll-mt-6 lg:h-[max(32rem,calc(100dvh-17rem))]">
                <div className="shrink-0 border-b border-border bg-card p-4 sm:p-5">
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <h2 id="notification-detail-heading" className="min-w-0 break-words text-base font-semibold text-foreground sm:text-lg">Chi tiết thông báo</h2>
                    <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
                      <Button variant="ghost" size="sm" aria-label="Thu gọn chi tiết thông báo" title="Về danh sách thông báo" className="h-10 w-10 shrink-0 p-0" onClick={closeDetail}>
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="m6 6 12 12M6 18 18 6" /></svg>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
                <dl className="grid min-w-0 grid-cols-2 gap-4 border-b border-border bg-brand-subtle/30 p-4 sm:p-5">
                  {selectedFields && <>
                    <div className="col-span-2 min-w-0">
                      <dt className="sr-only">Trẻ liên quan</dt>
                      <dd className="break-words text-base font-semibold text-foreground [overflow-wrap:anywhere]">{selectedFields.childName}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="min-h-8 text-xs font-medium text-muted sm:min-h-0">Thời điểm xảy ra</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">{selectedFields.occurredAtLabel}</dd>
                    </div>
                  </>}
                  <div className={selectedFields ? "min-w-0" : "col-span-2 min-w-0"}>
                    <dt className="min-h-8 text-xs font-medium text-muted sm:min-h-0">Thời gian nhận thông báo</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground"><time dateTime={selected.createdAtUtc}>{timeFormatter.format(new Date(selected.createdAtUtc))} - {dayFormatter.format(new Date(selected.createdAtUtc))}</time></dd>
                  </div>
                </dl>
                <div className="space-y-2 p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-foreground">{selectedFields ? "Mô tả sự cố" : "Nội dung thông báo sự cố"}</h3>
                  <p data-testid="incident-description" className="select-text whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{selectedFields?.description ?? selected.message}</p>
                </div>
                </div>
                <div className="flex shrink-0 justify-end border-t border-border bg-card p-4 sm:p-5">
                      <Button size="sm" className="min-h-10 whitespace-nowrap" aria-label="Xem lịch sử sức khỏe" title="Xem lịch sử sức khỏe"
                        onClick={() => router.push("/medical/health-history")}>
                        Xem lịch sử sức khỏe <span aria-hidden="true">→</span>
                      </Button>
                </div>
              </section>}
            </div>
          </>
        )}
    </div>
  );
}
