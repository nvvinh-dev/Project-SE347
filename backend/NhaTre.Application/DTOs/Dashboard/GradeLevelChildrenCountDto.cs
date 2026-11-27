namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-02, D39 mục 12: Thống kê số lượng trẻ phân bổ theo 3 khối lớp (Mầm, Chồi, Lá)
// AC-DASH-06, D45, BR-DASHBOARD-03: Chỉ trả số liệu tổng hợp, không có danh sách hay thông tin nhận diện từng cá nhân
public record GradeLevelChildrenCountDto(
    short GradeLevelId,
    string GradeLevelName,
    short SortOrder,
    int MinAgeMonths,
    int MaxAgeMonths,
    int StudentCount
);
