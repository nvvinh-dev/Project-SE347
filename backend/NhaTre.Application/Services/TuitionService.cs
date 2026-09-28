using System.Globalization;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class TuitionService : ITuitionService
{
    // Số tiền trong thông báo viết kiểu Việt Nam (1.500.000), không phụ thuộc culture của máy chủ
    private static readonly NumberFormatInfo VietnameseNumberFormat = new()
    {
        NumberGroupSeparator = ".",
        NumberDecimalSeparator = ","
    };

    private readonly ITuitionRepository _tuitionRepository;
    private readonly IChildRepository _childRepository;
    private readonly INotificationService _notificationService;

    public TuitionService(
        ITuitionRepository tuitionRepository,
        IChildRepository childRepository,
        INotificationService notificationService)
    {
        _tuitionRepository = tuitionRepository;
        _childRepository = childRepository;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync()
    {
        var fees = await _tuitionRepository.GetAllFeesAsync();
        return fees.Select(ToResponse).ToList();
    }

    public async Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);
        return fee is null ? null : ToResponse(fee);
    }

    // D39 mục 4: một mức phí chung toàn trường. Đã có biểu phí thì trả null để Controller
    // báo 409 — Kế toán sửa mức phí hiện có chứ không tạo thêm
    public async Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request)
    {
        if (await _tuitionRepository.AnyFeeAsync())
            return null;

        var fee = new TuitionFee
        {
            Description = request.Description.Trim(),
            Amount = request.Amount
        };

        _tuitionRepository.AddFee(fee);
        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    // Hóa đơn chép số tiền và mô tả lúc tạo, nên sửa biểu phí không làm đổi hóa đơn đã lập (D39 mục 4)
    public async Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);

        if (fee is null)
            return null;

        fee.Description = request.Description.Trim();
        fee.Amount = request.Amount;

        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    public async Task<IReadOnlyList<InvoiceResponse>> GetInvoicesAsync(Guid? childId, string? status)
    {
        var invoices = await _tuitionRepository.GetInvoicesAsync(childId, status);
        return invoices.Select(ToResponse).ToList();
    }

    public async Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id)
    {
        var invoice = await _tuitionRepository.FindInvoiceByIdAsync(id);
        return invoice is null ? null : ToResponse(invoice);
    }

    // Hóa đơn chỉ lập được khi đã có biểu phí (UC-TUITION-02) và luôn gắn với biểu phí đó.
    // Trạng thái và thời điểm lập do server đặt (BR-TUITION-09, D44 mục 2)
    public async Task<InvoiceResult> CreateInvoiceAsync(InvoiceRequest request)
    {
        var child = await _childRepository.FindByIdAsync(request.ChildId);
        if (child is null)
            return new InvoiceResult(InvoiceOutcome.ChildNotFound);

        var fee = (await _tuitionRepository.GetAllFeesAsync()).FirstOrDefault();
        if (fee is null)
            return new InvoiceResult(InvoiceOutcome.TuitionFeeMissing);

        var invoice = new Invoice
        {
            ChildId = child.Id,
            Child = child,
            TuitionFeeId = fee.Id,
            Amount = request.Amount,
            Description = request.Description.Trim(),
            IssuedAt = DateTime.UtcNow,
            Status = InvoiceStatuses.Unpaid
        };

        _tuitionRepository.AddInvoice(invoice);
        await _tuitionRepository.SaveChangesAsync();

        // D39 mục 6: hóa đơn mới gửi phụ huynh của đúng trẻ, sau khi hóa đơn đã lưu
        await _notificationService.NotifyParentsOfChildAsync(child.Id,
            $"Có hóa đơn mới cho bé {child.FullName}: {invoice.Description}, " +
            $"số tiền {invoice.Amount.ToString("#,##0.##", VietnameseNumberFormat)} đồng.");

        return new InvoiceResult(InvoiceOutcome.Success, ToResponse(invoice));
    }

    // Hóa đơn đã paid bị khóa: mọi yêu cầu sửa số tiền, mô tả hay trẻ → 409 (BR-TUITION-12, D44 mục 4).
    // Hóa đơn unpaid sửa được cả trẻ vì không có thao tác xóa, lập nhầm trẻ chỉ sửa được cách này.
    // Sửa không sinh thông báo — D39 mục 6 chỉ có sự kiện hóa đơn mới
    public async Task<InvoiceResult> UpdateInvoiceAsync(Guid id, InvoiceRequest request)
    {
        var invoice = await _tuitionRepository.FindInvoiceByIdAsync(id);
        if (invoice is null)
            return new InvoiceResult(InvoiceOutcome.InvoiceNotFound);

        if (invoice.Status == InvoiceStatuses.Paid)
            return new InvoiceResult(InvoiceOutcome.InvoicePaid);

        if (request.ChildId != invoice.ChildId)
        {
            var child = await _childRepository.FindByIdAsync(request.ChildId);
            if (child is null)
                return new InvoiceResult(InvoiceOutcome.ChildNotFound);

            invoice.ChildId = child.Id;
            invoice.Child = child;
        }

        invoice.Amount = request.Amount;
        invoice.Description = request.Description.Trim();

        await _tuitionRepository.SaveChangesAsync();
        return new InvoiceResult(InvoiceOutcome.Success, ToResponse(invoice));
    }

    private static TuitionFeeResponse ToResponse(TuitionFee fee)
        => new(fee.Id, fee.Description, fee.Amount);

    private static InvoiceResponse ToResponse(Invoice invoice)
        => new(invoice.Id, invoice.ChildId, invoice.Child.FullName, invoice.Amount,
            invoice.Description, invoice.Status, invoice.IssuedAt);
}
