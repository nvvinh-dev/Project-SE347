import React from "react";
import { Input, InputProps } from "./Input";

export interface SearchInputProps extends Omit<InputProps, "leftIcon"> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", value, onClear, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        value={value}
        leftIcon={
          <svg className="w-4 h-4 text-[#8C8A97]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[#9E9AA9] hover:text-[#16141F] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        className={`w-56 ${className}`}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";