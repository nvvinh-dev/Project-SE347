export type MenuDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface MenuEntry {
  dayOfWeek: MenuDay;
  description: string;
}

export interface WeeklyMenuResponse {
  id: string;
  weekStartDate: string;
  entries: MenuEntry[];
}

export interface CreateWeeklyMenuRequest {
  weekStartDate: string;
  entries: MenuEntry[];
}

export interface UpdateWeeklyMenuRequest {
  entries: MenuEntry[];
}
