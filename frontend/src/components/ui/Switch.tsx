import React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled = false, label, id }: SwitchProps) {
  return (
    <label className={`inline-flex items-center gap-2.5 select-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42B591]/40 ${
          checked ? "bg-[#42B591]" : "bg-[#D1D0D7]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && <span className="text-sm font-medium text-[#16141F]">{label}</span>}
    </label>
  );
}