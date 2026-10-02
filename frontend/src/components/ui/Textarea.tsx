import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCount?: boolean;
  maxLength?: number;
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
        <div className="mt-1 flex items-center justify-between text-xs">
          {error ? <p className="text-danger">{error}</p> : <span />}
          {showCount && maxLength !== undefined && (
            <span
              className={cn(
                "ml-auto text-[11px]",
                currentLength >= maxLength
                  ? "font-semibold text-danger"
                  : "text-muted"
              )}
            >
              {currentLength}/{maxLength} ký tự
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// Alias
export const FormTextarea = Textarea;
