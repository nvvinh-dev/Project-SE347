namespace NhaTre.Domain.Entities;

public class Incident
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateTime OccurredAt { get; set; }
    public string Description { get; set; } = null!;

    public Child Child { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
    public ICollection<IncidentPhoto> IncidentPhotos { get; set; } = new List<IncidentPhoto>();
}