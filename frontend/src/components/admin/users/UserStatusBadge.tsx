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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#18794E] border border-[#A7F3D0]",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#30A46C]" />
        Đang hoạt động
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8F8F9] text-[#737373] border border-[#E8E8EC]",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#9E9AA9]" />
      Đã vô hiệu hóa
    </span>
  );
}
