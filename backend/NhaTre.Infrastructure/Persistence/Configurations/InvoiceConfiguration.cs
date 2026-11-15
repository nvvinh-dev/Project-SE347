using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.Property(i => i.Amount).HasPrecision(12, 2);

        // Lọc danh sách theo trạng thái và đếm hóa đơn chưa thanh toán cho báo cáo doanh thu
        builder.HasIndex(i => i.Status);

        // Một nội dung chuyển khoản chỉ trỏ tới một hóa đơn (D21 mục 1)
        builder.Property(i => i.PaymentCode).HasMaxLength(PaymentCodes.Length);
        builder.HasIndex(i => i.PaymentCode).IsUnique();

        // Định dạng mã phải khớp PaymentCodes
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Invoice_AmountPositive", "amount > 0");
            t.HasCheckConstraint("CK_Invoice_Status", "status IN ('unpaid', 'paid')");
            t.HasCheckConstraint("CK_Invoice_PaymentCode", "payment_code ~ '^HP[A-HJ-NP-Z2-9]{8}$'");
        });

        builder.HasOne(i => i.Child)
            .WithMany(c => c.Invoices)
            .HasForeignKey(i => i.ChildId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}