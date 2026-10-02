namespace NhaTre.Application.DTOs.Tuition;

// Dùng cho cả tạo và sửa. Không có Status: hóa đơn mới luôn unpaid do server đặt (BR-TUITION-09),
// client gửi kèm status thì bị bỏ qua. Số tiền và mô tả mặc định do frontend lấy từ biểu phí,
// Kế toán ghi thêm kỳ thu vào mô tả (D39 mục 4)
public record InvoiceRequest(
    Guid ChildId,
    decimal Amount,
    string Description);
