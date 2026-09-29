import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, children, disabled, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none bg-white text-[#16141F] text-sm rounded-lg border pl-3.5 pr-8 py-2 transition-all duration-150 outline-none cursor-pointer
            ${
              error
                ? "border-[#E5484D] focus:border-[#E5484D] focus:ring-2 focus:ring-[#E5484D]/20"
                : "border-[#E8E8EC] hover:border-[#D1D0D7] focus:border-[#42B591] focus:ring-2 focus:ring-[#42B591]/20"
            }
            disabled:bg-[#F3F2F7] disabled:text-[#9E9AA9] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6A677B]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && <p className="mt-1 text-xs text-[#E5484D] font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";