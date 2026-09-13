namespace NhaTre.Domain.Entities;

public class IncidentPhoto
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public string FileReference { get; set; } = null!; // storage-agnostic — provider chưa chốt (D22)

    public Incident Incident { get; set; } = null!;
}