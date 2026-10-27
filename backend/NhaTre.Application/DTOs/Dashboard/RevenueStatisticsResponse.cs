namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-04, AC-DASH-04: Thống kê doanh thu tháng hiện tại cho Admin (D39 mục 12)
// Lấy nguồn từ ITuitionService.GetRevenueReportAsync() (FR-TUITION-03, D39 mục 12), không tự tính lại
// AC-DASH-06, D40 mục 3, D45: Toàn bộ phản hồi là số liệu tổng hợp, không có dữ liệu mức từng trẻ/hóa đơn
public record RevenueStatisticsResponse(
    int Year,
    int Month,
    decimal TotalCollected,
    int UnpaidInvoiceCount,
    DateTime GeneratedAtUtc
);
