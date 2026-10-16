namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-02, AC-DASH-02: Thống kê số lượng trẻ đã nhập học (tổng toàn trường và phân bổ theo các khối lớp)
// AC-DASH-06, D45: Toàn bộ dữ liệu là số liệu tổng hợp, không có bản ghi chi tiết
public record ChildrenStatisticsResponse(
    int TotalStudents,
    int AssignedStudents,
    int UnassignedStudents,
    int TotalClasses,
    IReadOnlyList<ClassChildrenCountDto> Classes
);
