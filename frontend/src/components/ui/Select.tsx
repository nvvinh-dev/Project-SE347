import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, disabled, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-lg border bg-card px-3.5 py-2 pr-10 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-background/60 disabled:opacity-70",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border hover:border-border-hover focus:border-brand focus:ring-brand/20",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-muted-light">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
