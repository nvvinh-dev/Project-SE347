import React from "react";
import { cn } from "@/lib/utils";

interface UserStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function UserStatusBadge({ isActive, className }: UserStatusBadgeProps) {
  if (isActive) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Đang hoạt động
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-background text-muted border border-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-light" />
      Đã vô hiệu hóa
    </span>
  );
}
