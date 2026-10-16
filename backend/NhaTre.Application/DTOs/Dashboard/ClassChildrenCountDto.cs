namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-02: Thống kê số lượng trẻ phân bổ theo từng lớp
// AC-DASH-06, D45: Chỉ trả số liệu tổng hợp, không có danh sách hay thông tin nhận diện trẻ
public record ClassChildrenCountDto(
    Guid ClassId,
    string ClassName,
    int StudentCount,
    int? MinAgeMonths,
    int? MaxAgeMonths,
    string? HomeroomTeacherName
);
