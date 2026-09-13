namespace NhaTre.Domain.Entities;

public class Class
{
    public Guid Id { get; set; }
    public Guid? HomeroomTeacherId { get; set; }
    public string Name { get; set; } = null!;
    public int? MinAgeMonths { get; set; }
    public int? MaxAgeMonths { get; set; }

    public Teacher? HomeroomTeacher { get; set; }
    public ICollection<Child> Children { get; set; } = new List<Child>();
    public ICollection<ActivityPhoto> ActivityPhotos { get; set; } = new List<ActivityPhoto>();
}