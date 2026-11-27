namespace NhaTre.Application.DTOs.Tuition;

// Lập hóa đơn hàng loạt có nhiều kiểu thất bại (404 biểu phí, lớp, khối; 409), nên Service trả kết quả
// kèm lý do để Controller chọn status code
public enum BulkInvoiceOutcome
{
    Success,
    TuitionFeeNotFound,
    ClassNotFound,
    GradeLevelNotFound,
    NothingToCreate
}

public record BulkInvoicePreviewResult(BulkInvoiceOutcome Outcome, BulkInvoicePreviewResponse? Preview = null);

public record BulkInvoiceResult(BulkInvoiceOutcome Outcome, BulkInvoiceResponse? Result = null);

// Một trẻ trong phạm vi, Repository trả cho Service. AlreadyInvoiced: trẻ đã có hóa đơn cùng mô tả
public record BulkInvoiceCandidate(
    Guid ChildId,
    string ChildFullName,
    bool AlreadyInvoiced);
