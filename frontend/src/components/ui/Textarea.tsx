import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCount?: boolean;
  maxLength?: number;
  /**
   * Độ dài hiện tại của nội dung. Nơi gọi phải tự `watch` field rồi truyền vào.
   * Ví dụ: `currentLength={watch("content")?.length ?? 0}`
   */
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      showCount = false,
      maxLength,
      currentLength = 0,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-light focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-background/60 disabled:opacity-70",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border hover:border-border-hover focus:border-brand focus:ring-brand/20",
            className
          )}
          {...props}
        />
        {showCount && maxLength !== undefined && (
          <div className="mt-1 flex justify-end text-xs">
            <span
              className={cn(
                "text-[11px]",
                currentLength >= maxLength
                  ? "font-semibold text-danger"
                  : "text-muted"
              )}
            >
              {currentLength}/{maxLength} ký tự
            </span>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
