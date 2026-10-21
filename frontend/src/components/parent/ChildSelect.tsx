"use client";

import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { MyChildResponse } from "@/types/children";

interface ChildSelectProps {
  id: string;
  name: string;
  value: string;
  options: MyChildResponse[];
  onChange: (value: string) => void;
  onBlur: () => void;
}

const normalize = (value: string) => value.toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export const ChildSelect = forwardRef<HTMLButtonElement, ChildSelectProps>(
  function ChildSelect({ id, name, value, options, onChange, onBlur }, forwardedRef) {
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef({ text: "", at: 0 });
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const selectedIndex = Math.max(0, options.findIndex((child) => child.id === value));
    const selected = options[selectedIndex];
    const active = options[activeIndex] ?? selected;
    const listId = `${id}-options`;

    useEffect(() => {
      if (!open) return;
      const dismiss = (event: PointerEvent) => {
        if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
      };
      document.addEventListener("pointerdown", dismiss);
      return () => document.removeEventListener("pointerdown", dismiss);
    }, [open]);

    useEffect(() => {
      if (open && active) {
        document.getElementById(`${listId}-${active.id}`)?.scrollIntoView({ block: "nearest" });
      }
    }, [open, active, listId]);

    const show = (index = selectedIndex) => {
      setActiveIndex(index);
      searchRef.current = { text: "", at: 0 };
      setOpen(true);
    };
    const choose = (child: MyChildResponse) => {
      onChange(child.id);
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Tab") { setOpen(false); return; }
      if (event.key === "Escape") {
        if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) show();
        else setActiveIndex(Math.min(options.length - 1, Math.max(0, activeIndex + (event.key === "ArrowDown" ? 1 : -1))));
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        show(event.key === "Home" ? 0 : options.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (open && active) choose(active);
        else show();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const now = Date.now();
        const text = (open && now - searchRef.current.at < 700 ? searchRef.current.text : "") + event.key;
        searchRef.current = { text, at: now };
        const index = options.findIndex((child) => normalize(child.fullName).startsWith(normalize(text)));
        if (index >= 0) { setActiveIndex(index); setOpen(true); }
      }
    };

    return (
      <div ref={rootRef} className="relative min-w-0">
        <button
          ref={(element) => {
            triggerRef.current = element;
            if (typeof forwardedRef === "function") forwardedRef(element);
            else if (forwardedRef) forwardedRef.current = element;
          }}
          id={id}
          name={name}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active ? `${listId}-${active.id}` : undefined}
          title={selected?.fullName}
          onBlur={() => { setOpen(false); onBlur(); }}
          onClick={() => { if (open) setOpen(false); else show(); }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
            open ? "border-brand ring-2 ring-brand/15" : "border-border hover:border-brand",
          )}
        >
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-sm font-semibold text-brand-text">
            {selected?.fullName.trim().split(/\s+/).at(-1)?.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{selected?.fullName}</span>
          <svg aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <ul id={listId} role="listbox" aria-label="Danh sách con"
            className="absolute left-0 top-full z-30 mt-2 max-h-[min(16rem,40dvh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-brand-border bg-card p-1.5 shadow-lg">
            {options.map((child, index) => (
              <li key={child.id} id={`${listId}-${child.id}`} role="option" aria-selected={child.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onPointerMove={(event) => { if (event.pointerType === "mouse") setActiveIndex(index); }}
                onClick={() => choose(child)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm [overflow-wrap:anywhere]",
                  child.id === value ? "bg-brand-subtle font-medium text-brand-text"
                    : index === activeIndex ? "bg-background text-foreground" : "text-foreground",
                )}>
                <span className="min-w-0">{child.fullName}</span>
                {child.id === value && (
                  <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
