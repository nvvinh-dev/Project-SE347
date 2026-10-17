namespace NhaTre.Application.DTOs.Tuition;

// FR-TUITION-05: phụ huynh xem hóa đơn của đúng trẻ đã chọn trên URL, nên chỉ trả số tiền, mô tả
// (kỳ thu — D39 mục 4), trạng thái và thời điểm lập (UC-TUITION-04, D45); không kèm họ tên trẻ hay biểu phí
public record ChildInvoiceResponse(
    Guid Id,
    decimal Amount,
    string Description,
    string Status,
    DateTime IssuedAtUtc);
