using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.Property(i => i.Amount).HasPrecision(12, 2);

        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Invoice_AmountPositive", "amount > 0");
            t.HasCheckConstraint("CK_Invoice_Status", "status IN ('unpaid', 'paid')");
        });
    }
}