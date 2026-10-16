namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-02, AC-DASH-02: Tổng số trẻ và tách theo 3 lớp
// D39 mục 12: Thống kê số lượng trẻ trong tháng hiện tại
// AC-DASH-06, D45: Không chứa dữ liệu mức từng trẻ
public record ChildrenStatisticsResponse(
    int TotalStudents,
    int AssignedStudents,
    int UnassignedStudents,
    IReadOnlyList<ClassChildrenCountDto> Classes
);
