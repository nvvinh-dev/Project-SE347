namespace NhaTre.Application.DTOs.Tuition;

public record InvoiceResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    decimal Amount,
    string Description,
    string Status,
    DateTime IssuedAtUtc);
