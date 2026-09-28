namespace NhaTre.Domain.Entities;

public class Attendance
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public DateTime CheckInTime { get; set; }
    public string Status { get; set; } = null!; // Present | AbsentExcused | AbsentUnexcused — check constraint ở DB (D51)

    public Child Child { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
    public Pickup? Pickup { get; set; }
}