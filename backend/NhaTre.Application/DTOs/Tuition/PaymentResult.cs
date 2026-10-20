namespace NhaTre.Application.DTOs.Tuition;

// Ghi nhận thanh toán thất bại theo hai kiểu (404 hóa đơn, 409 đã thanh toán), nên Service trả
// kết quả kèm lý do để Controller chọn status code
public enum PaymentOutcome
{
    Success,
    InvoiceNotFound,
    InvoicePaid
}

public record PaymentResult(PaymentOutcome Outcome, PaymentResponse? Payment = null);
