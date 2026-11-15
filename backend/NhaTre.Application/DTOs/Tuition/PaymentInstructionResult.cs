namespace NhaTre.Application.DTOs.Tuition;

// Xem thông tin chuyển khoản thất bại theo hai kiểu (404 ngoài phạm vi, 409 đã thanh toán),
// nên Service trả kết quả kèm lý do để Controller chọn status code
public enum PaymentInstructionOutcome
{
    Success,
    InvoiceNotFound,
    InvoicePaid
}

public record PaymentInstructionResult(
    PaymentInstructionOutcome Outcome,
    PaymentInstructionResponse? Instruction = null);
