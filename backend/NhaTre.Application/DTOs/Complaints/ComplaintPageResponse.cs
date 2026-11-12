namespace NhaTre.Application.DTOs.Complaints;

// TotalCount là tổng số phản ánh khớp bộ lọc, để frontend tính số trang (api-conventions.md §2.1)
public record ComplaintPageResponse(
    IReadOnlyList<ComplaintResponse> Items,
    int Page,
    int PageSize,
    int TotalCount);
