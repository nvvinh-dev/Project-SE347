using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Interfaces;

public interface ITuitionService
{
    Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync();
    Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id);
    Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request);
    Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request);

    Task<IReadOnlyList<InvoiceResponse>> GetInvoicesAsync(Guid? childId, string? status);
    Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id);
    Task<InvoiceResult> CreateInvoiceAsync(InvoiceRequest request);
    Task<InvoiceResult> UpdateInvoiceAsync(Guid id, InvoiceRequest request);

    // null khi trẻ không tồn tại hoặc không liên kết với phụ huynh (Controller trả 404)
    Task<IReadOnlyList<ChildInvoiceResponse>?> GetChildInvoicesForGuardianAsync(Guid childId, Guid parentUserId);
    Task<ChildInvoiceResponse?> GetChildInvoiceForGuardianAsync(Guid childId, Guid invoiceId, Guid parentUserId);

    Task<RevenueReportResponse> GetRevenueReportAsync();
}
