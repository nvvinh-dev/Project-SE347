namespace NhaTre.Domain.Entities;

public class Pickup
{
    public Guid Id { get; set; }
    public Guid AttendanceId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public Guid? PickupPersonId { get; set; }
    public DateTime PickupTime { get; set; }

    public Attendance Attendance { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
    public RegisteredPickupPerson? PickupPerson { get; set; }
}