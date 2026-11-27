using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class BankTransactionConfiguration : IEntityTypeConfiguration<BankTransaction>
{
    public void Configure(EntityTypeBuilder<BankTransaction> builder)
    {
        builder.Property(b => b.TransactionId).HasMaxLength(100);
        builder.Property(b => b.AccountNumber).HasMaxLength(30);
        builder.Property(b => b.Amount).HasPrecision(12, 2);
        builder.Property(b => b.Content).HasMaxLength(500);
        builder.Property(b => b.ReceivedAt).HasDefaultValueSql("now()");
        builder.Property(b => b.Status).HasMaxLength(20);
        builder.Property(b => b.UnmatchedReason).HasMaxLength(30);
        builder.Property(b => b.ResolutionNote).HasMaxLength(500);

        // Ngân hàng gửi lại hay gửi đồng thời một giao dịch chỉ lưu được một dòng (D21 mục 2)
        builder.HasIndex(b => b.TransactionId).IsUnique();

        // Kế toán lọc giao dịch theo trạng thái (D21 mục 3)
        builder.HasIndex(b => b.Status);

        // D51: CHECK chặn các đường ghi không qua Service. Danh sách phải khớp
        // BankTransactionStatuses và UnmatchedReasons.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_BankTransaction_AmountPositive", "amount > 0");
            t.HasCheckConstraint(
                "CK_BankTransaction_Status",
                "status IN ('Matched', 'Unmatched', 'Dismissed')");
            t.HasCheckConstraint(
                "CK_BankTransaction_UnmatchedReason",
                "unmatched_reason IS NULL OR unmatched_reason IN " +
                "('NoInvoiceCode', 'AmbiguousInvoiceCode', 'AmountMismatch', 'InvoiceAlreadyPaid')");
            t.HasCheckConstraint(
                "CK_BankTransaction_UnmatchedHasReason",
                "status <> 'Unmatched' OR unmatched_reason IS NOT NULL");
            t.HasCheckConstraint(
                "CK_BankTransaction_MatchedHasInvoice",
                "(status = 'Matched') = (invoice_id IS NOT NULL)");
            t.HasCheckConstraint(
                "CK_BankTransaction_DismissedHasResolution",
                "status <> 'Dismissed' OR (resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL)");
        });

        // Khóa ngoại cho phép rỗng của thanh toán vẫn Restrict (D37)
        builder.HasOne(b => b.Invoice)
            .WithMany()
            .HasForeignKey(b => b.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(b => b.ResolvedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
