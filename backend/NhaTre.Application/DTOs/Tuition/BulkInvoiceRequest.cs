namespace NhaTre.Application.DTOs.Tuition;

// FR-TUITION-10: dùng chung cho xem trước và lập. Số tiền và mô tả mặc định do frontend lấy từ biểu phí
// như FR-TUITION-02. Không có Status: hóa đơn mới luôn unpaid (BR-TUITION-09)
public record BulkInvoiceRequest(
    Guid TuitionFeeId,
    decimal Amount,
    string Description,
    BulkInvoiceScope Scope);

// Type là một trong InvoiceBulkScopeTypes. Id là chuỗi vì id lớp là Guid còn id khối là số; toàn trường
// không gửi Id
public record BulkInvoiceScope(
    string Type,
    string? Id);
