using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Interfaces;

// D57: phần "gọi HTTP" của Ngân hàng giả lập. Ký body bằng BankWebhook:SecretKey rồi POST tới
// MockBank:WebhookUrl, đi đúng đường như ngân hàng thật, không gọi thẳng service đối soát
public interface IMockBankWebhookClient
{
    // true khi webhook trả 2xx. Mã khác, lỗi kết nối hay quá thời gian chờ đều là false, không ném lỗi
    Task<bool> SendAsync(BankTransactionNotification notification);
}
