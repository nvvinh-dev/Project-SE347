import React from "react";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center bg-[#F3F2F7] p-1 rounded-lg border border-[#E8E8EC] ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`font-medium rounded-md transition-all duration-150 outline-none ${
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
            } ${
              isSelected
                ? "bg-white text-[#16141F] shadow-xs font-semibold"
                : "text-[#6A677B] hover:text-[#16141F]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}