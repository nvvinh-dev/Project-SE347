namespace NhaTre.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; } // lấy từ invoices.amount ngay lúc chuyển paid, không nhận từ client (D44 mục 4)
    public DateTime PaidAt { get; set; } // giờ server lúc Kế toán ghi nhận
    public string PaymentMethod { get; set; } = null!; // PaymentMethods — check constraint ở DB (D51)
    public string? ExternalReference { get; set; } // mã giao dịch ngân hàng của BankTransfer, rỗng với Cash (D21)
    public Guid RecordedByUserId { get; set; } // Kế toán ghi nhận, lấy từ sub (D44)

    public Invoice Invoice { get; set; } = null!;
}
