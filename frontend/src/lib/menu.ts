import type { MenuDay } from "@/types/menu";

export const MENU_DAYS: { value: MenuDay; label: string }[] = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 7, label: "Chủ nhật" },
];

export const MENU_MEALS = [
  { key: "breakfast", label: "Bữa sáng", prefix: "Sáng", placeholder: "Ví dụ: Cháo gà, sữa" },
  { key: "lunch", label: "Bữa trưa", prefix: "Trưa", placeholder: "Ví dụ: Cơm, cá sốt cà, canh rau" },
  { key: "afternoon", label: "Bữa chiều", prefix: "Chiều", placeholder: "Ví dụ: Sữa chua, trái cây" },
] as const;

export interface MenuMealValues {
  breakfast: string;
  lunch: string;
  afternoon: string;
  legacyDescription: string | null;
  originalDescription: string | null;
}

/** Tách mô tả cũ, gồm cả nhãn Xế, mà không bỏ nội dung chưa có nhãn. */
export function parseMenuMeals(description: string): MenuMealValues {
  const meals: MenuMealValues = {
    breakfast: "", lunch: "", afternoon: "", legacyDescription: null, originalDescription: description || null,
  };
  const pattern = /(?:^|\n|;[ \t]*)[ \t]*(?:(?:bữa|buổi)[ \t]+)?(sáng|trưa|chiều|xế)(?:[ \t]+chiều)?[ \t]*:[ \t]*/giu;
  const labels = [...description.matchAll(pattern)];
  if (!labels.length) {
    meals.breakfast = description;
    meals.legacyDescription = description || null;
    return meals;
  }
  const unlabelled = description.slice(0, labels[0].index).trim();
  if (unlabelled) meals.breakfast = unlabelled;
  labels.forEach((label, index) => {
    const key = label[1].toLocaleLowerCase("vi") === "sáng" ? "breakfast"
      : label[1].toLocaleLowerCase("vi") === "trưa" ? "lunch" : "afternoon";
    const content = description.slice(label.index! + label[0].length, labels[index + 1]?.index ?? description.length).trim();
    meals[key] = [meals[key], content].filter(Boolean).join("\n");
  });
  return meals;
}

/** API giữ một description/ngày; giao diện tự thêm nhãn khi ghép ba ô nhập. */
export function serializeMenuMeals(meals: MenuMealValues): string {
  // Ngày không sửa giữ nguyên mô tả cũ, cả nhãn Xế và nội dung sát giới hạn 1000 ký tự.
  if (meals.originalDescription !== null) {
    const original = parseMenuMeals(meals.originalDescription);
    if (MENU_MEALS.every((meal) => meals[meal.key] === original[meal.key])) return meals.originalDescription.trim();
  }
  return MENU_MEALS.flatMap((meal) => {
    const content = meals[meal.key].trim();
    return content ? [`${meal.prefix}: ${content}`] : [];
  }).join("\n");
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function getWeekStart(value: string): string | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  const result = date.toISOString().slice(0, 10);
  return parseDateOnly(result) ? result : null;
}

export function shiftMenuDate(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  const result = date.toISOString().slice(0, 10);
  return parseDateOnly(result) ? result : value;
}

export function currentMenuWeek() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (name: string) => parts.find((item) => item.type === name)!.value;
  return getWeekStart(`${part("year")}-${part("month")}-${part("day")}`)!;
}

export function formatMenuDate(value: string) {
  return value.split("-").reverse().join("/");
}
