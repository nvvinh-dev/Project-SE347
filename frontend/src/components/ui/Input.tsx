import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A677B] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full bg-white text-[#16141F] placeholder:text-[#9E9AA9] text-sm rounded-lg border transition-all duration-150 outline-none
            ${leftIcon ? "pl-9" : "pl-3.5"}
            ${rightIcon ? "pr-9" : "pr-3.5"}
            py-2
            ${
              error
                ? "border-[#E5484D] focus:border-[#E5484D] focus:ring-2 focus:ring-[#E5484D]/20 bg-[#FEF2F2]/30"
                : "border-[#E8E8EC] hover:border-[#D1D0D7] focus:border-[#42B591] focus:ring-2 focus:ring-[#42B591]/20"
            }
            disabled:bg-[#F3F2F7] disabled:text-[#9E9AA9] disabled:border-[#E8E8EC] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A677B]">
            {rightIcon}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-[#E5484D] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";