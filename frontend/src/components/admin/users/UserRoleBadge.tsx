import React from "react";
import type { Role } from "@/types/auth";
import { cn } from "@/lib/utils";

interface UserRoleBadgeProps {
  role: Role;
  className?: string;
}

const ROLE_CONFIG: Record<
  Role,
  { label: string; bg: string; text: string; border: string }
> = {
  Admin: {
    label: "Quản trị viên",
    bg: "bg-[#F5F0FF]",
    text: "text-[#583F8C]",
    border: "border-[#E3D8FF]",
  },
  Teacher: {
    label: "Giáo viên",
    bg: "bg-[#E8F8F1]",
    text: "text-[#1A624C]",
    border: "border-[#A7E5D2]",
  },
  Accountant: {
    label: "Kế toán",
    bg: "bg-[#FFF9E6]",
    text: "text-[#7A5B00]",
    border: "border-[#FFF3DD]",
  },
  Medical: {
    label: "Nhân viên Y tế",
    bg: "bg-[#FBE8E2]",
    text: "text-[#8A4F42]",
    border: "border-[#FAC4CD]",
  },
  Parent: {
    label: "Phụ huynh",
    bg: "bg-[#EAF7FC]",
    text: "text-[#17627D]",
    border: "border-[#D5E3F2]",
  },
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? {
    label: role,
    bg: "bg-[#F8F8F9]",
    text: "text-[#606363]",
    border: "border-[#ECEDEC]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
}
