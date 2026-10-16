"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { toApiError } from "@/lib/axios";
import type { ChildProfileRequest, ChildResponse } from "@/types/children";

interface ChildProfileFormProps {
  child?: ChildResponse;
  isBusy: boolean;
  isSaving: boolean;
  onSave: (data: ChildProfileRequest) => Promise<ChildResponse>;
  onCancel: () => void;
}

const FIELD_PATTERNS: Record<keyof ChildProfileRequest, RegExp> = {
  fullName: /fullName|họ (?:và )?tên/iu,
  enrollmentDate: /enrollmentDate|ngày nhập học/iu,
  dateOfBirth: /dateOfBirth|ngày sinh/iu,
};

export function ChildProfileForm({
  child,
  isBusy,
  isSaving,
  onSave,
  onCancel,
}: ChildProfileFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    clearErrors,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ChildProfileRequest>({
    defaultValues: {
      fullName: child?.fullName ?? "",
      dateOfBirth: child?.dateOfBirth.slice(0, 10) ?? "",
      enrollmentDate: child?.enrollmentDate.slice(0, 10) ?? "",
    },
  });

  const submit = async (data: ChildProfileRequest) => {
    if (isBusy) return;
    clearErrors();

    try {
      const saved = await onSave({ ...data, fullName: data.fullName.trim() });
      reset({
        fullName: saved.fullName,
        dateOfBirth: saved.dateOfBirth.slice(0, 10),
        enrollmentDate: saved.enrollmentDate.slice(0, 10),
      });
    } catch (error) {
      const apiError = toApiError(error);
      const fieldErrors: Partial<Record<keyof ChildProfileRequest, string[]>> = {};
      const otherErrors: string[] = [];

      // Backend trả danh sách thông báo, chưa kèm tên trường.
      for (const message of apiError.errors ?? []) {
        const field = (Object.keys(FIELD_PATTERNS) as (keyof ChildProfileRequest)[])
          .find((name) => FIELD_PATTERNS[name].test(message));
        if (field) (fieldErrors[field] ??= []).push(message);
        else otherErrors.push(message);
      }

      const invalidFields = Object.keys(fieldErrors) as (keyof ChildProfileRequest)[];
      for (const field of invalidFields) {
        setError(field, { type: "server", message: fieldErrors[field]!.join(" ") });
      }
      if (invalidFields[0]) setFocus(invalidFields[0]);
      if (otherErrors.length || !apiError.errors?.length) {
        setError("root.server", {
          message: otherErrors.length ? otherErrors.join(" ") : apiError.message,
        });
      }
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
      <FormField id="child-full-name" label="Họ tên" required error={errors.fullName?.message}>
        <Input
          id="child-full-name"
          autoFocus
          autoComplete="off"
          placeholder="Nhập họ tên trẻ"
          disabled={isBusy}
          error={errors.fullName?.message}
          aria-invalid={!!errors.fullName}
          {...register("fullName", {
            setValueAs: (value: string) => value.trim(),
            required: "Họ tên trẻ không được để trống.",
            maxLength: { value: 100, message: "Họ tên trẻ không được dài quá 100 ký tự." },
          })}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="child-date-of-birth" label="Ngày sinh" required error={errors.dateOfBirth?.message}>
          <Input
            id="child-date-of-birth"
            type="date"
            className="min-w-0"
            disabled={isBusy}
            error={errors.dateOfBirth?.message}
            aria-invalid={!!errors.dateOfBirth}
            {...register("dateOfBirth", {
              required: "Ngày sinh không được để trống.",
              deps: ["enrollmentDate"],
              validate: (value) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Ngày sinh không hợp lệ.";
                return value <= new Date().toISOString().slice(0, 10)
                  || "Ngày sinh không được sau ngày hôm nay.";
              },
            })}
          />
        </FormField>
        <FormField id="child-enrollment-date" label="Ngày nhập học" required error={errors.enrollmentDate?.message}>
          <Input
            id="child-enrollment-date"
            type="date"
            className="min-w-0"
            disabled={isBusy}
            error={errors.enrollmentDate?.message}
            aria-invalid={!!errors.enrollmentDate}
            {...register("enrollmentDate", {
              required: "Ngày nhập học không được để trống.",
              validate: (value) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Ngày nhập học không hợp lệ.";
                return value >= getValues("dateOfBirth")
                  || "Ngày nhập học không được trước ngày sinh.";
              },
            })}
          />
        </FormField>
      </div>

      <FormField error={errors.root?.server?.message}>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          <Button type="button" variant="secondary" disabled={isBusy} onClick={onCancel}>Hủy</Button>
          <Button type="submit" disabled={isBusy} isLoading={isSaving}>Lưu hồ sơ</Button>
        </div>
      </FormField>
    </form>
  );
}
