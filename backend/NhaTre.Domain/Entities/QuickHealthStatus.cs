namespace NhaTre.Domain.Entities;

public class QuickHealthStatus
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Notes { get; set; } = null!;

    public Child Child { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
}