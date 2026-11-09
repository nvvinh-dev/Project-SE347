import { formatMenuDate, MENU_DAYS, MENU_MEALS, parseMenuMeals, shiftMenuDate } from "@/lib/menu";
import type { MenuEntry } from "@/types/menu";

interface WeeklyMenuViewProps {
  week: string;
  entries: MenuEntry[];
}

export function WeeklyMenuView({ week, entries }: WeeklyMenuViewProps) {
  return (
    <section aria-label="Thực đơn các ngày trong tuần" className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div aria-hidden="true" className="hidden grid-cols-[8rem_repeat(3,minmax(0,1fr))] gap-5 border-b border-brand-border bg-brand-subtle px-5 py-4 text-center text-sm font-semibold text-brand-text md:grid">
        <span>Ngày</span>
        {MENU_MEALS.map((meal) => <span key={meal.key}>{meal.label}</span>)}
      </div>
      <div className="divide-y divide-border">
        {MENU_DAYS.map((day, index) => {
          const date = shiftMenuDate(week, index);
          const entry = entries.find((item) => item.dayOfWeek === day.value);
          const meals = entry ? parseMenuMeals(entry.description) : null;

          return (
            <article key={day.value} aria-labelledby={`parent-menu-day-${day.value}`} className="grid items-center gap-4 px-4 py-5 md:grid-cols-[8rem_repeat(3,minmax(0,1fr))] md:gap-5 md:px-5">
              <div className="flex flex-col items-center gap-1 text-center">
                <h2 id={`parent-menu-day-${day.value}`} className="font-semibold text-foreground">{day.label}</h2>
                <time dateTime={date} className="text-sm tabular-nums text-muted">{formatMenuDate(date)}</time>
              </div>
              {!entry || !entry.description.trim() ? (
                <p className="rounded-lg bg-background/60 px-3 py-2 text-center text-sm text-muted md:col-span-3">Chưa có thực đơn</p>
              ) : meals?.legacyDescription ? (
                // Văn bản cũ chưa chia bữa: giữ nguyên, không tự gán thành Bữa sáng.
                <p className="min-w-0 text-center whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed text-foreground md:col-span-3">{entry.description}</p>
              ) : (
                MENU_MEALS.map((meal) => (
                  <div key={meal.key} className="min-w-0 rounded-xl bg-background/40 p-3 text-center md:rounded-none md:bg-transparent md:p-0">
                    <h3 className="mb-1 text-xs font-semibold text-brand-text md:sr-only">{meal.label}</h3>
                    <p className={`whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed ${meals?.[meal.key].trim() ? "text-foreground" : "text-muted"}`}>
                      {meals?.[meal.key].trim() || "Chưa có thực đơn"}
                    </p>
                  </div>
                ))
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
