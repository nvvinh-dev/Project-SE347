namespace NhaTre.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public short RoleId { get; set; }
    public string FullName { get; set; } = null!;
    public string LoginIdentifier { get; set; } = null!; // email, chuẩn hóa lowercase ở Application (D20)
    public string CredentialReference { get; set; } = null!; // password hash — PasswordHasher<T> (D6)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public Role Role { get; set; } = null!;
    public Teacher? Teacher { get; set; }
    public ICollection<ChildGuardian> ChildGuardians { get; set; } = new List<ChildGuardian>();
    public ICollection<GrowthMeasurement> GrowthMeasurements { get; set; } = new List<GrowthMeasurement>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}