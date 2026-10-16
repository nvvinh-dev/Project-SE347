import React, { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border bg-card px-3.5 py-2 text-sm text-foreground transition-colors placeholder:text-muted-light focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-background/60 disabled:opacity-70",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border hover:border-border-hover focus:border-brand focus:ring-brand/20",
              Boolean(leftIcon) && "pl-10",
              Boolean(rightIcon) && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-muted">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
