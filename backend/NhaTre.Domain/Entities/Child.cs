namespace NhaTre.Domain.Entities;

public class Child
{
    public Guid Id { get; set; }
    public Guid? ClassId { get; set; }
    public string FullName { get; set; } = null!;
    public DateOnly DateOfBirth { get; set; }
    public DateOnly EnrollmentDate { get; set; }
    public string? HealthNotes { get; set; } // lưu ý sức khỏe — chỉ Y tế ghi, Kế toán không đọc (D39 mục 14, D45)

    public Class? Class { get; set; }
    public ICollection<ChildGuardian> ChildGuardians { get; set; } = new List<ChildGuardian>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<RegisteredPickupPerson> RegisteredPickupPersons { get; set; } = new List<RegisteredPickupPerson>();
    public ICollection<QuickHealthStatus> QuickHealthStatuses { get; set; } = new List<QuickHealthStatus>();
    public ICollection<GrowthMeasurement> GrowthMeasurements { get; set; } = new List<GrowthMeasurement>();
    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}