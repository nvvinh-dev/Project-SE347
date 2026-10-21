namespace NhaTre.Application.DTOs.Incidents;

// Photos là mọi ảnh đã đính vào sự cố (FR-INCIDENT-02), rỗng khi chưa đính ảnh nào (BR-INCIDENT-03)
public record IncidentResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    DateTime OccurredAtUtc,
    string Description,
    IReadOnlyList<IncidentPhotoResponse> Photos);
