namespace NhaTre.Domain.Entities;

public class RegisteredPickupPerson
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public string FullName { get; set; } = null!;

    public Child Child { get; set; } = null!;
    public ICollection<Pickup> Pickups { get; set; } = new List<Pickup>();
}