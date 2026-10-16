"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useGuardians, useSearchParentAccounts } from "@/hooks/useChildren";
import type { GuardianResponse } from "@/types/children";

interface GuardiansPanelProps {
  childId: string;
  isBusy: boolean;
  linkingUserId?: string;
  errorMessage: string | null;
  onLink: (guardian: GuardianResponse) => void;
  onUnlink: (guardian: GuardianResponse, trigger: HTMLButtonElement) => void;
}

function GuardianIdentity({ guardian }: { guardian: GuardianResponse }) {
  return (
    <div className="min-w-0 flex-1 basis-40 [overflow-wrap:anywhere]">
      <p className="text-sm font-medium text-foreground">{guardian.fullName}</p>
      <p className="mt-1 text-xs text-muted">{guardian.email}</p>
    </div>
  );
}

export function GuardiansPanel({
  childId,
  isBusy,
  linkingUserId,
  errorMessage,
  onLink,
  onUnlink,
}: GuardiansPanelProps) {
  const guardians = useGuardians(childId);
  const { register, control } = useForm<{ search: string }>({ defaultValues: { search: "" } });
  const search = useWatch({ control, name: "search" }).trim();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const results = useSearchParentAccounts(debouncedSearch);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <section aria-labelledby="guardians-title" className="min-w-0 space-y-5">
      <div>
        <h3 id="guardians-title" className="text-base font-semibold text-foreground">Phụ huynh</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">Kiểm tra họ tên và email để liên kết đúng tài khoản.</p>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger [overflow-wrap:anywhere]">
          {errorMessage}
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-brand-border bg-brand-subtle/40 p-4">
        <FormField id="parent-search" label="Tìm tài khoản phụ huynh">
          <Input
            id="parent-search" type="search" autoComplete="off" placeholder="Nhập họ tên hoặc email"
            aria-describedby="parent-search-hint"
            aria-controls={search.length >= 2 ? "parent-search-results" : undefined}
            disabled={isBusy}
            leftIcon={
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path strokeLinecap="round" d="m16 16 4.5 4.5" />
              </svg>
            }
            {...register("search")}
          />
        </FormField>
        <p id="parent-search-hint" className="text-xs text-muted">Nhập ít nhất 2 ký tự để tìm kiếm.</p>

        {search.length >= 2 && (
          <div id="parent-search-results" aria-live="polite" className="max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-brand-border bg-card sm:max-h-64">
            {search !== debouncedSearch || results.isLoading ? (
              <StatusMessage status="loading" title="Đang tìm phụ huynh..." />
            ) : results.isError ? (
              <StatusMessage
                status="error" title="Không thể tìm phụ huynh" message={results.error.message}
                onRetry={() => { void results.refetch(); }}
              />
            ) : !results.data?.length ? (
              <StatusMessage status="empty" message="Không tìm thấy tài khoản phụ huynh phù hợp." className="p-5" />
            ) : (
              <ul className="divide-y divide-brand-border">
                {results.data.map((guardian) => {
                  const linked = guardians.data?.some((item) => item.userId === guardian.userId);
                  return (
                    <li key={guardian.userId} className="flex flex-wrap items-center gap-3 p-3">
                      <GuardianIdentity guardian={guardian} />
                      {linked ? (
                        <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-1 text-xs font-medium text-brand-text">Đã liên kết</span>
                      ) : (
                        <Button
                          size="sm" disabled={isBusy || guardians.isLoading || guardians.isError}
                          isLoading={linkingUserId === guardian.userId}
                          aria-label={`Liên kết với ${guardian.fullName} (${guardian.email})`}
                          onClick={() => onLink(guardian)}
                        >Liên kết</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-muted">Đã liên kết</h4>
          {guardians.isSuccess && (
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
              {guardians.data.length}
            </span>
          )}
        </div>
        {guardians.isLoading ? (
          <StatusMessage status="loading" title="Đang tải phụ huynh..." />
        ) : guardians.isError ? (
          <StatusMessage
            status="error" title="Không thể tải phụ huynh" message={guardians.error.message}
            onRetry={() => { void guardians.refetch(); }}
          />
        ) : !guardians.data?.length ? (
          <StatusMessage
            status="empty" title="Chưa có phụ huynh"
            message="Tìm tài khoản ở trên để liên kết với trẻ." className="p-5"
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {guardians.data.map((guardian) => (
              <li key={guardian.userId} className="flex flex-wrap items-center gap-3 p-3">
                <GuardianIdentity guardian={guardian} />
                <Button
                  size="sm" variant="ghost" className="shrink-0 text-danger! hover:text-danger" disabled={isBusy}
                  aria-label={`Gỡ liên kết với ${guardian.fullName} (${guardian.email})`}
                  onClick={(event) => onUnlink(guardian, event.currentTarget)}
                >Gỡ liên kết</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
