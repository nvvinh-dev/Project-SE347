namespace NhaTre.Domain.Entities;

public class ActivityPhoto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid UploadedByTeacherId { get; set; }
    public DateTime UploadedAt { get; set; }
    public string FileReference { get; set; } = null!;

    public Class Class { get; set; } = null!;
    public Teacher UploadedByTeacher { get; set; } = null!;
}