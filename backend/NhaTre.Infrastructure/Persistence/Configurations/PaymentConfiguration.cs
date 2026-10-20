using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.Property(p => p.Amount).HasPrecision(12, 2);
        builder.Property(p => p.PaymentMethod).HasMaxLength(20);
        builder.Property(p => p.ExternalReference).HasMaxLength(100);

        // D51: validator vẫn là nơi kiểm tra chính; CHECK chặn các đường ghi không qua validator.
        // Danh sách phải khớp PaymentMethods.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Payment_AmountPositive", "amount > 0");
            t.HasCheckConstraint("CK_Payment_Method", "payment_method IN ('Cash', 'BankTransfer')");
        });

        builder.HasOne(p => p.Invoice)
            .WithMany(i => i.Payments)
            .HasForeignKey(p => p.InvoiceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Người ghi nhận là bằng chứng của khoản đã thu, không mất theo tài khoản (D37)
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
