import React from "react";

export type BadgeVariant = "default" | "brand" | "outline" | "success" | "warning" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-[#F3F2F7] text-[#16141F] border border-[#E8E8EC]",
  brand: "bg-[#42B591] text-white font-medium border border-[#42B591]",
  outline: "bg-transparent text-[#6A677B] border border-[#E8E8EC]",
  success: "bg-[#ECFDF5] text-[#30A46C] border border-[#A7F3D0]",
  warning: "bg-[#FFFBEB] text-[#F5A524] border border-[#FDE68A]",
  danger: "bg-[#FEF2F2] text-[#E5484D] border border-[#FECACA]",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${badgeVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}