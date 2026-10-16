namespace NhaTre.Application.DTOs.Tuition;

// Kỳ báo cáo là tháng hiện tại theo giờ Việt Nam: [PeriodStartUtc, PeriodEndUtc).
// UnpaidInvoiceCount là số hóa đơn còn unpaid tại GeneratedAtUtc, không lọc theo tháng
public record RevenueReportResponse(
    int Year,
    int Month,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc,
    DateTime GeneratedAtUtc,
    decimal TotalCollected,
    int UnpaidInvoiceCount);
