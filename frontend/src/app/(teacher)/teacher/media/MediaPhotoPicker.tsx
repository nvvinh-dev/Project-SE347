import { useEffect, useMemo, useRef, type Ref } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import InvalidPhotoPreview from "../incidents/InvalidPhotoPreview";
import { validateSinglePhoto } from "../incidents/_lib/health-incidents";

const PICKER_ID = "media-photos-picker";
const ERROR_ID = "media-photos-error";

interface MediaPhotoPickerProps {
  files: File[];
  error?: string;
  disabled: boolean;
  /** Ref của React Hook Form, gắn vào nút mở hộp chọn ảnh để lỗi ảnh đưa focus về đúng nút này. */
  fieldRef: Ref<HTMLButtonElement>;
  onChange: (files: File[]) => void;
}

export default function MediaPhotoPicker({ files, error, disabled, fieldRef, onChange }: MediaPhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const describedBy = error ? ERROR_ID : undefined;

  // Trình duyệt mặc định mở tệp ảnh khi thả trượt ra ngoài vùng tải, làm mất các ảnh đã chọn.
  useEffect(() => {
    const preventOutsideDrop = (event: DragEvent) => event.preventDefault();
    window.addEventListener("dragover", preventOutsideDrop);
    window.addEventListener("drop", preventOutsideDrop);
    return () => {
      window.removeEventListener("dragover", preventOutsideDrop);
      window.removeEventListener("drop", preventOutsideDrop);
    };
  }, []);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: validateSinglePhoto(file).valid ? URL.createObjectURL(file) : null,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previews]);

  const addFiles = (list: FileList | null) => {
    if (list?.length) onChange([...files, ...Array.from(list)]);
    // Xóa giá trị để người dùng chọn lại được đúng tệp vừa bỏ đi.
    if (input.current) input.current.value = "";
  };

  const openPicker = () => input.current?.click();

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-center justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <label htmlFor={PICKER_ID} className="text-xs font-semibold text-foreground">
            <span className="mr-1 text-danger">*</span>
            Ảnh hoạt động
          </label>
          {files.length > 0 && (
            <span className="break-words text-xs text-muted [overflow-wrap:anywhere]" aria-live="polite">
              (Đã chọn {files.length}/5 ảnh)
            </span>
          )}
        </div>
        {files.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange([])}
            className="h-auto shrink-0 p-0 text-xs text-muted hover:text-danger"
          >
            Bỏ tất cả
          </Button>
        ) : (
          <span className="break-words text-xs text-muted [overflow-wrap:anywhere]" aria-live="polite">
            Đã chọn 0/5 ảnh
          </span>
        )}
      </div>

      {error && (
        <p id={ERROR_ID} className="text-xs text-danger">
          {error}
        </p>
      )}

      <div
        role="region"
        aria-label="Khu vực tải ảnh"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled && event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "min-w-0 rounded-xl transition-colors",
          files.length > 0 && "rounded-2xl border-2 border-dashed border-border/80 bg-background/25 p-4 sm:p-5"
        )}
      >
        {files.length === 0 ? (
          <div
            className={cn(
              "group relative flex min-h-[250px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:min-h-[270px] sm:p-10",
              error
                ? "border-danger-border bg-danger-bg/10 ring-1 ring-danger-border"
                : "border-border bg-background/30 hover:border-brand hover:bg-brand-subtle/10"
            )}
          >
            <div className="mb-3.5 flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-subtle text-brand shadow-2xs transition-transform group-hover:scale-105">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <p className="mb-1.5 text-sm font-semibold text-foreground sm:text-base">
              Kéo ảnh vào đây hoặc chọn từ thiết bị
            </p>
            <p className="mb-4 text-xs font-normal text-muted">JPEG hoặc PNG, tối đa 5 ảnh, mỗi ảnh ≤ 5 MB</p>
            <Button
              ref={fieldRef}
              variant="secondary"
              className="min-h-10 cursor-pointer border-brand-border px-6 text-xs font-medium text-brand-text shadow-2xs hover:bg-brand-subtle sm:text-sm"
              disabled={disabled}
              aria-describedby={describedBy}
              onClick={openPicker}
            >
              Chọn ảnh
            </Button>
          </div>
        ) : (
          <div className="min-w-0 space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs text-muted">
              <span className="text-[11px] sm:text-xs">
                Kéo thêm ảnh vào khung hoặc bấm ô &quot;Thêm ảnh&quot; bên dưới
              </span>
              <span className="shrink-0 text-[11px] text-muted-light">Tối đa 5 ảnh (≤ 5 MB)</span>
            </div>

            {/* Chỉ chia hai cột từ xl nên đến lg lưới còn đủ rộng để ảnh và nút bỏ ảnh không đè lên nhau. */}
            <ul className="grid min-w-0 grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5">
              {previews.map((item, index) => (
                <li key={item.url ?? `${item.file.name}-${index}`} className="flex min-w-0 flex-col">
                  <div
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-xl border bg-card shadow-2xs transition-all",
                      item.url ? "border-border hover:border-brand-border" : "border-danger ring-1 ring-danger"
                    )}
                  >
                    {item.url ? (
                      // Ảnh xem trước là blob cục bộ, không có URL ký nên dùng thẻ img thường.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={`Ảnh đã chọn ${index + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <InvalidPhotoPreview />
                    )}

                    <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-foreground/75 px-1.5 py-0.5 text-[10px] font-bold text-card backdrop-blur-xs">
                      {index + 1}
                    </span>

                    {/* Vùng chạm 44 px cho điện thoại, phần nhìn thấy chỉ là vòng tròn nhỏ ở góc. */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -right-1 -top-1 z-10 flex h-11 min-h-11 w-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 hover:bg-transparent"
                      aria-label={`Bỏ ảnh thứ ${index + 1}`}
                      disabled={disabled}
                      onClick={() => onChange(files.filter((_, i) => i !== index))}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-card shadow-xs transition-colors hover:bg-danger">
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </Button>
                  </div>
                  <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1 text-xs">
                    <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted">
                      {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </li>
              ))}

              {files.length < 5 && (
                <li className="flex min-w-0 flex-col">
                  <Button
                    ref={fieldRef}
                    variant="ghost"
                    disabled={disabled}
                    aria-describedby={describedBy}
                    onClick={openPicker}
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/60 p-2 text-center shadow-2xs transition-all hover:border-brand hover:bg-brand-subtle/20"
                  >
                    <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-subtle text-brand shadow-2xs">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-foreground">Thêm ảnh</span>
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Trường tệp ẩn để mở hộp chọn ảnh từ các nút ở trên; người dùng chỉ thao tác qua các nút đó. */}
      <div className="sr-only" aria-hidden="true">
        <Input
          id={PICKER_ID}
          type="file"
          multiple
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          ref={input}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>
    </div>
  );
}
