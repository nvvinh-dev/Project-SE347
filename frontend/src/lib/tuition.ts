const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

// Cột numeric(12,2): tối đa 10 chữ số phần nguyên. Học phí tính bằng đồng nên chỉ nhận số nguyên.
export const MAX_TUITION_AMOUNT = 9_999_999_999;
export const FEE_DESCRIPTION_MAX = 500;
export const INVOICE_DESCRIPTION_MAX = 1000;
export const EXTERNAL_REFERENCE_MAX = 100;

const currencyFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TIME_ZONE, month: "2-digit", year: "numeric",
});

export function formatCurrency(amount: number) {
  return `${currencyFormatter.format(amount)} đ`;
}

/** Hiển thị số tiền trong ô nhập: 2000000 → "2.000.000". */
export function formatAmountInput(amount: number) {
  return currencyFormatter.format(amount);
}

/** Nhận "2.000.000", "2 000 000" hoặc "2000000"; trả null nếu không phải số nguyên dương. */
export function parseAmountInput(value: string): number | null {
  const digits = value.replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function validateAmountInput(value: string) {
  if (!value.trim()) return "Số tiền không được để trống.";
  const amount = parseAmountInput(value);
  if (amount === null) return "Số tiền chỉ gồm chữ số, không có phần lẻ.";
  if (amount <= 0) return "Số tiền phải lớn hơn 0.";
  if (amount > MAX_TUITION_AMOUNT) return "Số tiền không được vượt quá 9.999.999.999 đ.";
  return true;
}

/** Ngày lập hóa đơn theo giờ Việt Nam. */
export function formatIssuedDate(utc: string) {
  const time = Date.parse(utc);
  return Number.isFinite(time) ? dateFormatter.format(time) : "—";
}

/** Kỳ thu mặc định là tháng hiện tại theo giờ Việt Nam, ví dụ "11/2026". */
export function currentBillingPeriod() {
  // vi-VN định dạng tháng thành "tháng 11, 2026", nên ghép tay từ các phần.
  const parts = monthFormatter.formatToParts(Date.now());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("month")}/${part("year")}`;
}
