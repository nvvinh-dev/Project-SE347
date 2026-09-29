import React from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, error, disabled, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 select-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className={`w-4 h-4 rounded border transition-colors cursor-pointer accent-[#42B591] focus:ring-2 focus:ring-[#42B591]/30 focus:outline-none
            ${error ? "border-[#E5484D]" : "border-[#E8E8EC] hover:border-[#D1D0D7]"}
            ${className}`}
          {...props}
        />
        {label && <span className="text-sm font-medium text-[#16141F]">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";