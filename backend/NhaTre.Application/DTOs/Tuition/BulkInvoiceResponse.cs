namespace NhaTre.Application.DTOs.Tuition;

// D45: kết quả chỉ kèm số trẻ và danh sách trẻ bị bỏ qua (id, họ tên, lý do)
public record BulkInvoicePreviewResponse(
    int CreatableCount,
    IReadOnlyList<BulkInvoiceSkippedChild> Skipped);

public record BulkInvoiceResponse(
    int CreatedCount,
    IReadOnlyList<BulkInvoiceSkippedChild> Skipped);

// Reason là một trong InvoiceSkipReasons
public record BulkInvoiceSkippedChild(
    Guid ChildId,
    string ChildFullName,
    string Reason);
