"use client";

import { useEffect, useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TuitionModal } from "@/components/accountant/tuition/TuitionModal";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SignedImage } from "@/components/ui/SignedImage";
import { fetchFreshFaceUrl, useSavePickupPerson } from "@/hooks/useParentPickupPersons";
import {
  PICKUP_CONSENT_TEXT, PICKUP_NAME_MAX, PICKUP_RELATIONSHIP_MAX, formatFileSize,
  validatePickupCitizenId, validatePickupName, validatePickupPhone, validatePickupPhoto,
  validatePickupRelationship,
} from "@/lib/pickup-person";
import { PICKUP_PRIMARY, type PickupPersonResponse, type PickupPriority } from "@/types/pickup";

interface FormValues {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  citizenIdNumber: string;
  photo: FileList | null;
  consent: boolean;
}

interface PickupPersonModalProps {
  childId: string;
  /** Có `person` là sửa; không có là thêm mới với `priority` đã chọn. */
  person?: PickupPersonResponse;
  priority?: PickupPriority;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * FR-PICKUP-03: popup thêm/sửa người đón. 4 thông tin + 1 ảnh khuôn mặt + ô đồng ý (D24). Ô đồng ý luôn
 * bắt đầu bỏ trống ở mỗi lần mở và nút Lưu chỉ bật khi đã đánh dấu; backend vẫn từ chối (400) nếu thiếu.
 */
export function PickupPersonModal({ childId, person, priority, onClose, onSaved }: PickupPersonModalProps) {
  const uid = useId();
  const save = useSavePickupPerson(childId);
  const isEdit = !!person;
  const role = (person?.priority ?? priority) === PICKUP_PRIMARY ? "chính" : "dự phòng";
  const title = isEdit ? `Sửa thông tin người đón ${role}` : priority === PICKUP_PRIMARY ? "Đăng ký người đón chính" : "Thêm người đón dự phòng";

  const {
    register, handleSubmit, setFocus, control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: person?.fullName ?? "",
      relationship: person?.relationship ?? "",
      phoneNumber: person?.phoneNumber ?? "",
      citizenIdNumber: person?.citizenIdNumber ?? "",
      photo: null,
      consent: false,
    },
  });
  const consent = useWatch({ control, name: "consent" });
  const photos = useWatch({ control, name: "photo" });
  const file = photos?.[0];
  const photoOk = validatePickupPhoto(photos, !isEdit) === true;

  // Popup mở xong mới đưa con trỏ vào ô đầu (showModal chạy sau effect của phần tử con).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFocus("fullName"));
    return () => cancelAnimationFrame(frame);
  }, [setFocus]);

  // Xem trước ảnh vừa chọn (chỉ khi hợp lệ); giải phóng URL tạm khi đổi ảnh hoặc đóng popup.
  const previewUrl = useMemo(() => (file && photoOk ? URL.createObjectURL(file) : null), [file, photoOk]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const submit = (values: FormValues) => {
    if (!values.consent || save.isPending) return;
    save.mutate({
      personId: person?.id,
      priority,
      input: {
        fullName: values.fullName,
        relationship: values.relationship,
        phoneNumber: values.phoneNumber,
        citizenIdNumber: values.citizenIdNumber,
        facePhoto: values.photo?.[0],
      },
    }, { onSuccess: onSaved });
  };

  const id = (name: string) => `${uid}-${name}`;
  const formId = id("form");
  const serverMessage = save.error
    ? (save.error.errors?.length ? save.error.errors.join(" ") : save.error.message)
    : null;
  const busy = save.isPending;

  return (
    <TuitionModal
      title={title}
      description="Nhập đủ thông tin để giáo viên đối chiếu khi đón bé."
      isBusy={busy}
      onClose={onClose}
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Hủy</Button>
        <Button type="submit" form={formId} className="sm:min-w-32" disabled={!consent} isLoading={busy}>
          {isEdit ? "Lưu thay đổi" : "Lưu người đón"}
        </Button>
      </>}
    >
      <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={id("name")} label="Họ và tên" required error={errors.fullName?.message}>
            <Input id={id("name")} autoComplete="off" maxLength={PICKUP_NAME_MAX + 20} disabled={busy}
              placeholder="Ví dụ: Nguyễn Thị Lan" error={errors.fullName?.message} aria-invalid={!!errors.fullName}
              {...register("fullName", { validate: validatePickupName })} />
          </FormField>
          <FormField id={id("rel")} label="Mối liên hệ với bé" required error={errors.relationship?.message}>
            <Input id={id("rel")} autoComplete="off" maxLength={PICKUP_RELATIONSHIP_MAX + 20} disabled={busy}
              placeholder="Ví dụ: Mẹ, Bà ngoại" error={errors.relationship?.message} aria-invalid={!!errors.relationship}
              {...register("relationship", { validate: validatePickupRelationship })} />
          </FormField>
          <FormField id={id("phone")} label="Số điện thoại" required hint="10 chữ số" error={errors.phoneNumber?.message}>
            <Input id={id("phone")} type="tel" inputMode="numeric" autoComplete="off" maxLength={14} disabled={busy}
              placeholder="0901234567" error={errors.phoneNumber?.message} aria-invalid={!!errors.phoneNumber}
              {...register("phoneNumber", { validate: validatePickupPhone })} />
          </FormField>
          <FormField id={id("cid")} label="Số CCCD" required hint="12 chữ số" error={errors.citizenIdNumber?.message}>
            <Input id={id("cid")} inputMode="numeric" autoComplete="off" maxLength={16} disabled={busy}
              placeholder="012345678901" error={errors.citizenIdNumber?.message} aria-invalid={!!errors.citizenIdNumber}
              {...register("citizenIdNumber", { validate: validatePickupCitizenId })} />
          </FormField>
        </div>

        <FormField id={id("photo")} label="Ảnh khuôn mặt" required={!isEdit}
          hint="JPEG/PNG, tối đa 5 MB" error={errors.photo?.message}>
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-brand-border bg-brand-subtle/40 p-3 sm:flex-row sm:items-center sm:p-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Ảnh khuôn mặt vừa chọn" className="h-full w-full object-cover" />
              ) : person ? (
                <SignedImage key={person.facePhotoUrl.split("?")[0]} src={person.facePhotoUrl}
                  getUrl={() => fetchFreshFaceUrl(childId, person.id)} alt="Ảnh khuôn mặt đang đăng ký"
                  fallbackText="Không thể tải ảnh" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-light">
                  <svg aria-hidden="true" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input id={id("photo")} type="file" accept="image/jpeg,image/png" disabled={busy}
                aria-invalid={!!errors.photo} className="peer sr-only"
                {...register("photo", { validate: (value) => validatePickupPhoto(value, !isEdit) })} />
              <label htmlFor={id("photo")}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-brand bg-card px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-subtle peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                {file ? "Chọn ảnh khác" : isEdit ? "Đổi ảnh khuôn mặt" : "Chọn ảnh khuôn mặt"}
              </label>
              <p className="break-words text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
                {file ? `${file.name} · ${formatFileSize(file.size)}`
                  : isEdit ? "Không chọn ảnh mới thì giữ nguyên ảnh hiện tại. Ảnh cũ sẽ bị xóa khi bạn thay ảnh."
                    : "Ảnh rõ mặt, chụp thẳng để giáo viên đối chiếu khi đón bé."}
              </p>
            </div>
          </div>
        </FormField>

        <div className="rounded-xl border border-warning-border bg-warning-bg p-3.5 sm:p-4">
          <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-3">
            <input id={id("consent")} type="checkbox" disabled={busy}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand" {...register("consent")} />
            <span className="text-sm leading-relaxed text-foreground">{PICKUP_CONSENT_TEXT}</span>
          </label>
        </div>

        {serverMessage && (
          <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger [overflow-wrap:anywhere]">
            {serverMessage}
          </p>
        )}
      </form>
    </TuitionModal>
  );
}
