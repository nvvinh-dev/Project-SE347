export function formatTemperatureCelsius(value: number | null): string {
  if (value === null) return "Không đo thân nhiệt";
  return `${value.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
}
