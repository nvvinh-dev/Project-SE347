using NhaTre.Application.DTOs.MockBank;

namespace NhaTre.Application.Interfaces;

// D57: Ngân hàng giả lập, chỉ đăng ký khi chạy Development và bật MockBank:Enabled. Module không có bảng
// riêng và không đọc invoices: nó chỉ đi vào hệ thống qua webhook như ngân hàng thật. Thay bằng ngân hàng
// thật thì bỏ cả module này (IMockBankService, IMockBankWebhookClient và phần hiện thực), webhook giữ nguyên
public interface IMockBankService
{
    // Tạo giao dịch vào tài khoản của trường rồi gửi qua webhook. Request đã qua validator
    Task<MockBankTransferResult> TransferAsync(MockBankTransferRequest request);
}
