namespace NhaTre.Domain.Entities;

public class ChildGuardian
{
    public Guid ChildId { get; set; }
    public Guid GuardianUserId { get; set; }

    public Child Child { get; set; } = null!;
    public User GuardianUser { get; set; } = null!;
}