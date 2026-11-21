namespace NhaTre.Application.DTOs.Tuition;

// FR-TUITION-08, D21 mục 2: một giao dịch tiền vào tài khoản của trường mà ngân hàng báo qua webhook.
// Webhook đã kiểm chữ ký và gọi validator trước khi đưa vào TuitionService; Service không biết gì về
// HTTP hay chữ ký
public record BankTransactionNotification(
    string TransactionId,
    string AccountNumber,
    decimal Amount,
    string Content,
    DateTime TransactionAtUtc);

// Chỉ hai kết quả, vì response webhook chỉ báo đã nhận, không cho biết giao dịch khớp hay không (D45):
// Accepted gồm cả gửi lại một giao dịch đã có, khớp hóa đơn và không khớp. WrongAccount là giao dịch
// vào tài khoản khác tài khoản của trường: không lưu gì, webhook trả 400
public enum BankReconcileOutcome
{
    Accepted,
    WrongAccount
}
