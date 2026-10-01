namespace NhaTre.Domain.Entities;

public class Pickup
{
    public Guid Id { get; set; }
    public Guid AttendanceId { get; set; }
    public Guid RecordedByTeacherId { get; set; }
    public DateTime PickupTime { get; set; }
    public string PickupMethod { get; set; } = null!;   // PickupMethods — CHECK ở DB (D24, D51)
    public string PickerFullName { get; set; } = null!; // họ tên chép lúc đón, không trỏ tới người đón (D24)
    public string? ConfirmedByName { get; set; }        // chỉ có khi PickupMethod = PhoneConfirmed (D39 mục 11)

    public Attendance Attendance { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
}