"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useTeacherAccounts } from "@/hooks/useTeachers";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { CreateTeacherRequest } from "@/types/teachers";

interface CreateTeacherFormProps {
  isBusy: boolean;
  initialFocusRef: RefObject<HTMLInputElement | null>;
  onSave: (data: CreateTeacherRequest) => Promise<void>;
  onClose: () => void;
}

interface FormValues extends CreateTeacherRequest {
  search: string;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLocaleLowerCase("vi").trim();
}

export function CreateTeacherForm({ isBusy, initialFocusRef, onSave, onClose }: CreateTeacherFormProps) {
  const accounts = useTeacherAccounts();
  const searchId = useId();
  const accountErrorId = useId();
  const focusSearchRef = useRef(false);
  const {
    register, control, handleSubmit, clearErrors, setError, setFocus, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { userId: "", search: "" } });
  const search = useWatch({ control, name: "search" });
  const userId = useWatch({ control, name: "userId" });
  const records = accounts.data ?? [];
  const term = normalizeSearch(search);
  const results = records.filter((account) =>
    normalizeSearch(account.fullName + " " + account.email).includes(term)
  );
  const selected = records.find((account) => account.userId === userId);
  const selectedIsVisible = results.some((account) => account.userId === userId);
  const disabled = isBusy || isSubmitting;
  const searchField = register("search", {
    onChange: () => clearErrors(),
  });
  const accountField = register("userId", {
    // Kiểm tra giá trị RHF giữ lại khi tài khoản đã chọn bị bộ lọc ẩn đi.
    validate: (value) => !value ? "Vui lòng chọn tài khoản giáo viên."
      : records.some((account) => account.userId === value)
        || "Tài khoản không còn khả dụng. Vui lòng chọn lại.",
    onChange: () => clearErrors(),
  });

  useEffect(() => {
    if (disabled || !focusSearchRef.current) return;
    focusSearchRef.current = false;
    setFocus("search");
  }, [disabled, setFocus]);

  const submit = async ({ userId: selectedId }: FormValues) => {
    if (isBusy) return;
    clearErrors();
    try {
      await onSave({ userId: selectedId });
    } catch (error) {
      const apiError = toApiError(error);
      const message = apiError.errors?.length ? apiError.errors.join(" ") : apiError.message;
      if (apiError.status === 400 || apiError.status === 409) {
        setValue("userId", "", { shouldDirty: true });
        setError("userId", { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
      focusSearchRef.current = true;
    }
  };

  return (
    <form noValidate onSubmit={(event) => { void handleSubmit(submit)(event); }} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="rounded-xl border border-brand-border bg-brand-subtle/50 p-4">
          <FormField id={searchId} label="Tìm tài khoản giáo viên">
            <Input
              {...searchField}
              ref={(element) => {
                searchField.ref(element);
                initialFocusRef.current = element;
              }}
              id={searchId}
              type="search"
              placeholder="Nhập họ tên hoặc email"
              autoComplete="off"
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </FormField>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Chỉ hiển thị tài khoản Giáo viên đang hoạt động, chưa có hồ sơ. Đối chiếu họ tên và email trước khi chọn.
          </p>
        </div>

        <div className="space-y-1.5">
          <fieldset disabled={disabled} aria-describedby={errors.userId ? accountErrorId : undefined}>
            <legend className="mb-3 text-sm font-semibold">
              Tài khoản giáo viên <span className="text-danger">*</span>
            </legend>
            {accounts.isLoading ? (
              <StatusMessage status="loading" title="Đang tải tài khoản giáo viên..." />
            ) : accounts.isError ? (
              <StatusMessage status="error" title="Không thể tải tài khoản giáo viên"
                message={accounts.error.message} onRetry={() => { void accounts.refetch(); }} />
            ) : records.length === 0 ? (
              <StatusMessage status="empty" title="Chưa có tài khoản phù hợp"
                message="Cần tài khoản Giáo viên đang hoạt động và chưa có hồ sơ. Liên hệ Admin nếu cần tạo hoặc kích hoạt tài khoản." />
            ) : results.length === 0 ? (
              <StatusMessage status="empty" title="Không tìm thấy tài khoản"
                message="Thử tìm bằng họ tên hoặc email khác." />
            ) : (
              <div className="space-y-2">
                {results.map((account) => (
                  <label key={account.userId} className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    account.userId === userId ? "border-brand bg-brand-subtle" : "border-border hover:border-brand-border",
                    disabled && "cursor-default opacity-60"
                  )}>
                    <input
                      type="radio"
                      value={account.userId}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand"
                      {...accountField}
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="block text-sm font-medium">{account.fullName}</span>
                      <span className="mt-1 block text-xs text-muted">{account.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div id={accountErrorId} role="alert" aria-atomic="true">
            <FormField error={errors.userId?.message}>{null}</FormField>
          </div>
        </div>

        {selected && !selectedIsVisible && !accounts.isError && (
          <div className="rounded-xl border border-brand-border bg-brand-subtle p-4 [overflow-wrap:anywhere]">
            <p className="text-xs font-semibold text-brand-text">Tài khoản được chọn</p>
            <p className="mt-2 text-sm font-medium">{selected.fullName}</p>
            <p className="mt-1 text-xs text-muted">{selected.email}</p>
          </div>
        )}
        {errors.root?.server && (
          <div role="alert"><FormField error={errors.root.server.message}>{null}</FormField></div>
        )}
      </div>
      <footer className="flex shrink-0 justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:px-6">
        <Button variant="secondary" disabled={disabled} onClick={onClose}>Hủy</Button>
        <Button type="submit" isLoading={disabled}
          disabled={accounts.isLoading || accounts.isError || records.length === 0}>
          Lưu hồ sơ
        </Button>
      </footer>
    </form>
  );
}
