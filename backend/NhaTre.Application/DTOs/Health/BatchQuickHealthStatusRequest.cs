namespace NhaTre.Application.DTOs.Health;

// D39 mục 21: ghi sức khỏe nhanh cho nhiều trẻ một lần, mỗi dòng như một bản ghi riêng (QuickHealthStatusRequest)
public record BatchQuickHealthStatusRequest(IReadOnlyList<QuickHealthStatusRequest> Items);
