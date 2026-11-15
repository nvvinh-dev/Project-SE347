namespace NhaTre.Application.Common;

// D21 mục 1: tài khoản nhận học phí của trường, đọc từ cấu hình PaymentAccount (không phải secret).
// BankBin là mã ngân hàng theo chuẩn VietQR, dùng để dựng URL ảnh QR. Trong đồ án là tài khoản giả (D57)
public record PaymentAccountSettings(
    string BankBin,
    string BankName,
    string AccountNumber,
    string AccountName);
