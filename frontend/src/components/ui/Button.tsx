import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#42B591] text-white font-medium hover:bg-[#36A07F] active:bg-[#2B876B] focus-visible:ring-2 focus-visible:ring-[#42B591]/40 border-transparent shadow-sm",
  secondary:
    "bg-[#F3F2F7] text-[#16141F] hover:bg-[#E8E8EC] active:bg-[#DCDCE2] border-transparent",
  outline:
    "bg-white text-[#16141F] border border-[#E8E8EC] hover:bg-[#F3F2F7] hover:border-[#D1D0D7] active:bg-[#E8E8EC]",
  ghost:
    "bg-transparent text-[#6A677B] hover:text-[#16141F] hover:bg-[#F3F2F7] active:bg-[#E8E8EC] border-transparent",
  danger:
    "bg-[#FEF2F2] text-[#E5484D] border border-[#FECACA] hover:bg-[#FEE2E2] active:bg-[#FCA5A5]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-base gap-2.5 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";