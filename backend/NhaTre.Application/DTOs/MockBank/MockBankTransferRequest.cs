namespace NhaTre.Application.DTOs.MockBank;

// D57: phụ huynh chuyển khoản trong Ngân hàng giả lập. Không có tài khoản nhận vì luôn là tài khoản của
// trường (PaymentAccount): phụ huynh sửa được số tiền và nội dung để thử chuyển sai, không đổi được nơi nhận
public record MockBankTransferRequest(
    decimal Amount,
    string Content);
