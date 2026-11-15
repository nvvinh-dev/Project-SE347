import { formatCurrency } from "@/lib/tuition";
import type { RevenueReportResponse } from "@/types/tuition";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

/** Kỳ báo cáo hiển thị bằng year/month; periodEndUtc là mốc không tính vào kỳ nên không dùng làm "đến ngày". */
export const formatReportPeriod = (report: RevenueReportResponse) => `Tháng ${report.month}/${report.year}`;

export function formatGeneratedAt(utc: string) {
  const time = Date.parse(utc);
  return Number.isFinite(time) ? dateTimeFormatter.format(time) : "—";
}

/** Các dòng "nhãn – giá trị" của báo cáo đang hiển thị, dùng cho file PDF. */
function reportRows(report: RevenueReportResponse): [string, string][] {
  return [
    ["Kỳ báo cáo", formatReportPeriod(report)],
    ["Thời điểm lập", formatGeneratedAt(report.generatedAtUtc)],
    ["Tổng thu trong tháng", formatCurrency(report.totalCollected)],
    ["Số hóa đơn chưa thanh toán", String(report.unpaidInvoiceCount)],
  ];
}

const escapeXml = (value: string) => value
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fileStem = (report: RevenueReportResponse) =>
  `bao-cao-doanh-thu-${report.year}-${String(report.month).padStart(2, "0")}`;

/**
 * FR-TUITION-04: xuất Excel không thêm package mới (D35) bằng định dạng XML Spreadsheet 2003.
 * shortcut: đuôi .xls nên Excel hiện cảnh báo định dạng một lần; cần .xlsx thật thì xin Lead thêm thư viện.
 */
export function exportRevenueExcel(report: RevenueReportResponse) {
  const text = (value: string) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
  const number = (value: number) => `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  const rows = [
    `<Row>${text("BÁO CÁO DOANH THU HỌC PHÍ")}</Row>`,
    `<Row>${text("Kỳ báo cáo")}${text(formatReportPeriod(report))}</Row>`,
    `<Row>${text("Thời điểm lập")}${text(formatGeneratedAt(report.generatedAtUtc))}</Row>`,
    `<Row>${text("Tổng thu trong tháng (đ)")}${number(report.totalCollected)}</Row>`,
    `<Row>${text("Số hóa đơn chưa thanh toán")}${number(report.unpaidInvoiceCount)}</Row>`,
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>`
    + `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`
    + `<Worksheet ss:Name="Doanh thu"><Table><Column ss:Width="190"/><Column ss:Width="170"/>${rows}</Table></Worksheet></Workbook>`;
  const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileStem(report)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

/** FR-TUITION-04: mở trang in sạch của báo cáo, chọn "Lưu dưới dạng PDF" trong hộp thoại in. Trả false nếu trình duyệt chặn cửa sổ mới. */
export function exportRevenuePdf(report: RevenueReportResponse) {
  const win = window.open("", "_blank");
  if (!win) return false;
  const body = reportRows(report).map(([label, value]) =>
    `<tr><th>${escapeXml(label)}</th><td>${escapeXml(value)}</td></tr>`).join("");
  win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeXml(fileStem(report))}</title>`
    + `<style>body{font-family:Arial,sans-serif;color:#1f2937;margin:40px}h1{font-size:20px;color:#247A60;margin:0 0 4px}`
    + `p{margin:0 0 24px;color:#6b7280;font-size:13px}table{border-collapse:collapse;width:100%;max-width:560px}`
    + `th,td{border:1px solid #C4EDE0;padding:10px 14px;text-align:left;font-size:14px}th{background:#F0FAF6;width:50%}</style></head>`
    + `<body><h1>Báo cáo doanh thu học phí</h1><p>${escapeXml(formatReportPeriod(report))}</p><table>${body}</table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}
