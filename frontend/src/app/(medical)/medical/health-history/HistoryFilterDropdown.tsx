"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { HealthHistoryItem } from "./_lib/types";

export type HistoryRecordType = HealthHistoryItem["type"];

const HISTORY_FILTERS: { value: HistoryRecordType; label: string }[] = [
  { value: "Incident", label: "Sự cố" },
  { value: "QuickHealthStatus", label: "Sức khỏe nhanh" },
  { value: "GrowthMeasurement", label: "Số đo phát triển" },
];

export const ALL_HISTORY_TYPES = HISTORY_FILTERS.map((filter) => filter.value);

interface HistoryFilterDropdownProps {
  counts: Record<HistoryRecordType, number>;
  onChange: (types: HistoryRecordType[]) => void;
}

export function HistoryFilterDropdown({ counts, onChange }: HistoryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { control, setFocus } = useForm<{ types: HistoryRecordType[] }>({
    defaultValues: { types: ALL_HISTORY_TYPES },
  });
  const selectedTypes = useWatch({ control, name: "types" });
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (!isOpen) return;

    setFocus("types");
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, setFocus]);

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="secondary"
        className="min-h-11"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />
        </svg>
        Bộ lọc{selectedTypes.length < ALL_HISTORY_TYPES.length ? ` (${selectedTypes.length}/3)` : ""}
      </Button>

      {isOpen && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label="Lọc loại bản ghi sức khỏe"
          className="absolute right-0 top-full z-20 mt-1 w-52 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-1.5 shadow-md"
        >
          <form onSubmit={(event) => event.preventDefault()}>
            <fieldset className="space-y-0.5">
              <legend className="sr-only">Chọn các loại bản ghi cần xem</legend>
              <Controller
                control={control}
                name="types"
                render={({ field }) => {
                  const allSelected = field.value.length === ALL_HISTORY_TYPES.length;
                  const updateTypes = (types: HistoryRecordType[]) => {
                    field.onChange(types);
                    onChange(types);
                  };
                  return (
                    <>
                      <label htmlFor={`${id}-all`} className="grid min-h-11 cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-3 rounded px-2 py-2 text-sm text-foreground hover:bg-background/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40">
                        <div className="relative h-4 w-4">
                          <Input
                            ref={field.ref}
                            id={`${id}-all`}
                            type="checkbox"
                            name={`${field.name}-all`}
                            checked={allSelected}
                            onBlur={field.onBlur}
                            onChange={() => updateTypes(allSelected ? [] : ALL_HISTORY_TYPES)}
                            className="!m-0 !h-4 !w-4 cursor-pointer appearance-none !rounded-[2px] !border-0 !p-0 checked:bg-border"
                          />
                          <svg className="pointer-events-none absolute inset-0 h-4 w-4 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth={0.75} />
                            {allSelected && (
                              <path className="text-foreground" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" d="m4 8 2.5 2.5L12 5" />
                            )}
                          </svg>
                        </div>
                        <span>Tất cả</span>
                        <span className="text-xs tabular-nums text-muted">({total})</span>
                      </label>
                      <div className="my-1 border-b border-border/60" />
                      {HISTORY_FILTERS.map((filter) => (
                        <label key={filter.value} htmlFor={`${id}-${filter.value}`} className="grid min-h-11 cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-3 rounded px-2 py-2 text-sm text-foreground hover:bg-background/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40">
                          <div className="relative h-4 w-4">
                            <Input
                              id={`${id}-${filter.value}`}
                              type="checkbox"
                              name={field.name}
                              value={filter.value}
                              checked={field.value.includes(filter.value)}
                              onBlur={field.onBlur}
                              onChange={(event) => updateTypes(event.target.checked
                                ? [...field.value, filter.value]
                                : field.value.filter((type) => type !== filter.value))}
                              className="!m-0 !h-4 !w-4 cursor-pointer appearance-none !rounded-[2px] !border-0 !p-0 checked:bg-border"
                            />
                            <svg className="pointer-events-none absolute inset-0 h-4 w-4 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth={0.75} />
                              {field.value.includes(filter.value) && (
                                <path className="text-foreground" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" d="m4 8 2.5 2.5L12 5" />
                              )}
                            </svg>
                          </div>
                          <span>{filter.label}</span>
                          <span className="text-xs tabular-nums text-muted">({counts[filter.value]})</span>
                        </label>
                      ))}
                    </>
                  );
                }}
              />
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
