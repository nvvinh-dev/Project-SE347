namespace NhaTre.Application.DTOs.Media;

// Tham số query của GET api/children/{childId}/activity-photos (api-conventions §2.1). Dùng thuộc tính init
// thay vì record vị trí để thiếu tham số nào thì giữ giá trị mặc định
public record ActivityPhotoListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
