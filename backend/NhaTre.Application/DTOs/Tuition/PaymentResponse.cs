namespace NhaTre.Application.DTOs.Tuition;

public record PaymentResponse(
    Guid Id,
    Guid InvoiceId,
    decimal Amount,
    string PaymentMethod,
    string? ExternalReference,
    DateTime PaidAtUtc);
