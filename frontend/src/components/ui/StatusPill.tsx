import React from "react";

export type StatusVariant = "success" | "warning" | "danger" | "brand" | "neutral";

interface StatusPillProps {
  variant?: StatusVariant | string;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { container: string; dot: string }> = {
  success: {
    container: "bg-[#ECFDF5] text-[#30A46C] border-[#A7F3D0]",
    dot: "bg-[#30A46C]",
  },
  warning: {
    container: "bg-[#FFFBEB] text-[#F5A524] border-[#FDE68A]",
    dot: "bg-[#F5A524]",
  },
  danger: {
    container: "bg-[#FEF2F2] text-[#E5484D] border-[#FECACA]",
    dot: "bg-[#E5484D]",
  },
  brand: {
    container: "bg-[#F0FAF6] text-[#247A60] border-[#C4EDE0]",
    dot: "bg-[#42B591]",
  },
  neutral: {
    container: "bg-[#F3F2F7] text-[#6A677B] border-[#E8E8EC]",
    dot: "bg-[#8C8A97]",
  },
};

export function StatusPill({
  variant = "neutral",
  children,
  dot = false,
  className = "",
}: StatusPillProps) {
  // Normalize alias variants (paid -> success, overdue -> danger, etc.)
  let normalizedVariant: StatusVariant = "neutral";
  if (variant === "success" || variant === "paid" || variant === "active") {
    normalizedVariant = "success";
  } else if (variant === "warning" || variant === "pending" || variant === "late") {
    normalizedVariant = "warning";
  } else if (variant === "danger" || variant === "overdue" || variant === "absent") {
    normalizedVariant = "danger";
  } else if (variant === "brand" || variant === "green") {
    normalizedVariant = "brand";
  }

  const styles = variantStyles[normalizedVariant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles.container} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      {children}
    </span>
  );
}