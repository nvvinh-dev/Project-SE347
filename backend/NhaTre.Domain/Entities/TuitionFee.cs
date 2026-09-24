namespace NhaTre.Domain.Entities;

public class TuitionFee
{
    public Guid Id { get; set; }
    public string Description { get; set; } = null!;
    public decimal Amount { get; set; } // check: amount > 0 — ràng buộc ở DB (D51)

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}