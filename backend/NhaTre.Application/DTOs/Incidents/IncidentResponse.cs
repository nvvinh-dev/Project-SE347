namespace NhaTre.Application.DTOs.Incidents;

public record IncidentResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    DateTime OccurredAtUtc,
    string Description);
