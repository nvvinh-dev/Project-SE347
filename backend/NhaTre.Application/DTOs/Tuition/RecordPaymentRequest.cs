namespace NhaTre.Application.DTOs.Tuition;

// Chỉ có hình thức và mã giao dịch. Số tiền, thời điểm và người ghi nhận do server đặt (BR-TUITION-11,
// D44 mục 2): request gửi kèm amount, status, paidAt hay người ghi nhận thì các trường đó bị bỏ qua
public record RecordPaymentRequest(
    string PaymentMethod,
    string? ExternalReference);
