namespace NhaTre.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; } // lấy từ invoices.amount ngay lúc chuyển paid, không nhận từ client (D44 mục 4)
    public DateTime PaidAt { get; set; } // giờ server lúc Kế toán ghi nhận; transaction_at của ngân hàng nếu có giao dịch (D21)
    public string PaymentMethod { get; set; } = null!; // PaymentMethods — check constraint ở DB (D51)
    public string? ExternalReference { get; set; } // mã giao dịch ngân hàng của BankTransfer, rỗng với Cash (D21)
    public Guid? RecordedByUserId { get; set; } // Kế toán ghi nhận, lấy từ sub (D44); rỗng khi tự đối soát (D21)
    public Guid? BankTransactionId { get; set; } // giao dịch làm bằng chứng; DB chặn thiếu cả hai cột này (D51)

    public Invoice Invoice { get; set; } = null!;
    public BankTransaction? BankTransaction { get; set; }
}
