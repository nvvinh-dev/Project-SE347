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

/**
 * Nhận "2000000" hoặc số có phân cách hàng nghìn bằng dấu chấm, dấu phẩy, khoảng trắng
 * ("2.000.000", "2,000,000", "2 000 000"); trả null nếu không phải số nguyên dương.
 * Chỉ nhận dấu phân cách đúng nhóm 3 chữ số để "1500000,5" vẫn bị báo là có phần lẻ.
 */
export function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed) && !/^\d{1,3}(?:[.,\s]\d{3})+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/[.,\s]/g, "");
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function validateAmountInput(value: string) {
  if (!value.trim()) return "Số tiền không được để trống.";
  const amount = parseAmountInput(value);
  if (amount === null) return "Số tiền chỉ gồm chữ số (có thể dùng dấu chấm hoặc dấu phẩy phân cách hàng nghìn), không có phần lẻ.";
  if (amount <= 0) return "Số tiền phải lớn hơn 0.";
  if (amount > MAX_TUITION_AMOUNT) return "Số tiền không được vượt quá 9.999.999.999 đ.";
  return true;
}

/** Ngày lập hóa đơn theo giờ Việt Nam. */
export function formatIssuedDate(utc: string) {
  const time = Date.parse(utc);
  return Number.isFinite(time) ? dateFormatter.format(time) : "—";
}

/**
 * Mô tả mặc định của hóa đơn: mô tả biểu phí + kỳ thu tháng hiện tại.
 * Biểu phí đã kết thúc bằng "tháng" thì không ghép thêm chữ "tháng" lần nữa.
 */
export function defaultInvoiceDescription(feeDescription: string) {
  const base = feeDescription.trim();
  const period = currentBillingPeriod();
  return /(^|\s)tháng$/iu.test(base) ? `${base} ${period}` : `${base} tháng ${period}`;
}

/** Kỳ thu mặc định là tháng hiện tại theo giờ Việt Nam, ví dụ "11/2026". */
export function currentBillingPeriod() {
  // vi-VN định dạng tháng thành "tháng 11, 2026", nên ghép tay từ các phần.
  const parts = monthFormatter.formatToParts(Date.now());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("month")}/${part("year")}`;
}
