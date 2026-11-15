using System.Security.Cryptography;

namespace NhaTre.Domain.Constants;

/// Mã thanh toán của hóa đơn — D21 mục 1: "HP" + 8 ký tự lấy từ bảng 32 ký tự gồm A–Z trừ I, O
/// và 2–9 (không có 0, 1, I, O để khỏi đọc nhầm). Khớp CHECK CK_Invoice_PaymentCode (D51).
/// Đây là chỗ duy nhất định nghĩa mã: tạo hóa đơn gọi Generate(), migration sinh mã cho hóa
/// đơn đã có dựng SQL từ chính Prefix, Alphabet và RandomLength.
public static class PaymentCodes
{
    public const string Prefix = "HP";
    public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public const int RandomLength = 8;
    public const int Length = 10; // Prefix.Length + RandomLength, độ dài cột invoices.payment_code

    // Dùng bộ sinh số ngẫu nhiên mật mã: mã không đoán được từ mã của hóa đơn khác
    public static string Generate() => Prefix + RandomNumberGenerator.GetString(Alphabet, RandomLength);
}
