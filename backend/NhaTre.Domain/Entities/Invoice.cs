namespace NhaTre.Domain.Entities;

public class Invoice
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid? TuitionFeeId { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = null!; // chép từ biểu phí lúc tạo, Kế toán ghi kỳ thu vào đây (D39 mục 4)
    public DateTime IssuedAt { get; set; }
    public string Status { get; set; } = null!; // InvoiceStatuses — check constraint ở DB (D51)

    public Child Child { get; set; } = null!;
    public TuitionFee? TuitionFee { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}