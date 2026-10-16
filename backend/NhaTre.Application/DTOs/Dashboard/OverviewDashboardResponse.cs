namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-01, AC-DASH-01: Dashboard tổng quan vận hành nhà trường cho Admin
// AC-DASH-06, D45: Toàn bộ dữ liệu là số liệu tổng hợp, không có bản ghi chi tiết
public record OverviewDashboardResponse(
    int TotalStudents,
    int AssignedStudents,
    int UnassignedStudents,
    int TotalClasses,
    int ClassesWithTeacherCount,
    int ActiveStaffCount,
    IReadOnlyList<ClassChildrenCountDto> Classes
);
