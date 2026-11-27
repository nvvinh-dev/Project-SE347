namespace NhaTre.Application.DTOs.Tuition;

// FR-TUITION-07: đủ thông tin để phụ huynh chuyển đúng số tiền với đúng nội dung (D45).
// TransferContent là mã thanh toán của hóa đơn; không kèm id, họ tên trẻ hay thanh toán nào
public record PaymentInstructionResponse(
    string BankName,
    string AccountNumber,
    string AccountName,
    decimal Amount,
    string TransferContent,
    string QrImageUrl);
