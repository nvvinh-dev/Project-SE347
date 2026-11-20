namespace NhaTre.Application.DTOs.Tuition;

// PaymentCode do server sinh lúc tạo, không đổi khi sửa (D21 mục 1)
public record InvoiceResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    decimal Amount,
    string Description,
    string Status,
    DateTime IssuedAtUtc,
    string PaymentCode);
