namespace NhaTre.Application.DTOs.Media;

// TotalCount là tổng số ảnh của lớp con đang học, để frontend tính số trang. Chỉ ảnh của trang này có URL ký
public record ActivityPhotoPageResponse(
    IReadOnlyList<ActivityPhotoResponse> Items,
    int Page,
    int PageSize,
    int TotalCount);
