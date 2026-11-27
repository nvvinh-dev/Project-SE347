namespace NhaTre.Application.DTOs.MockBank;

// D57: biên lai như app ngân hàng thật. Không kèm kết quả đối soát (khớp hóa đơn nào, đã gạch nợ chưa) vì
// ngân hàng không biết hóa đơn; hóa đơn chỉ đổi qua webhook
public record MockBankReceipt(
    string TransactionId,
    decimal Amount,
    string Content,
    DateTime TransactionAtUtc);

// Delivered: webhook trả 2xx. WebhookFailed: webhook trả mã khác, không kết nối được hoặc quá thời gian chờ;
// controller trả 502 và coi như giao dịch chưa xảy ra
public enum MockBankTransferOutcome
{
    Delivered,
    WebhookFailed
}

public record MockBankTransferResult(
    MockBankTransferOutcome Outcome,
    MockBankReceipt? Receipt = null);
