namespace NhaTre.Application.DTOs.Complaints;

// Tham số query của GET api/complaints. Dùng thuộc tính init thay vì record vị trí để thiếu tham số
// nào thì giữ giá trị mặc định. Status null thì lấy mọi trạng thái
public record ComplaintListQuery
{
    public string? Status { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
