namespace NhaTre.Application.DTOs.Health;

public record QuickHealthStatusResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    DateTime RecordedAtUtc,
    string Mood,
    decimal? TemperatureCelsius,
    string Notes);
