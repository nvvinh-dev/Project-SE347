namespace NhaTre.Application.DTOs.Tuition;

// Tạo và sửa hóa đơn có nhiều kiểu thất bại (404 trẻ, 404 hóa đơn, 409), nên Service trả
// kết quả kèm lý do để Controller chọn status code
public enum InvoiceOutcome
{
    Success,
    ChildNotFound,
    InvoiceNotFound,
    TuitionFeeMissing,
    InvoicePaid
}

public record InvoiceResult(InvoiceOutcome Outcome, InvoiceResponse? Invoice = null);
