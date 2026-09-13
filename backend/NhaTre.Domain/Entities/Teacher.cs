namespace NhaTre.Domain.Entities;

public class Teacher
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Class> HomeroomClasses { get; set; } = new List<Class>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Pickup> Pickups { get; set; } = new List<Pickup>();
    public ICollection<QuickHealthStatus> QuickHealthStatuses { get; set; } = new List<QuickHealthStatus>();
    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
    public ICollection<ActivityPhoto> ActivityPhotos { get; set; } = new List<ActivityPhoto>();
}