namespace NhaTre.Application.DTOs.Tuition;

public record TuitionFeeResponse(
    Guid Id,
    string Description,
    decimal Amount);
