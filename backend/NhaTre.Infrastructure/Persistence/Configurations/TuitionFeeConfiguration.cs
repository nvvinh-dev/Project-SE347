using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class TuitionFeeConfiguration : IEntityTypeConfiguration<TuitionFee>
{
    public void Configure(EntityTypeBuilder<TuitionFee> builder)
    {
        builder.Property(f => f.Amount).HasPrecision(12, 2);
        builder.ToTable(t => t.HasCheckConstraint("CK_TuitionFee_AmountPositive", "amount > 0"));
    }
}