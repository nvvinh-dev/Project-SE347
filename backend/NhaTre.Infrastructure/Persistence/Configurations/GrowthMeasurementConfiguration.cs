using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class GrowthMeasurementConfiguration : IEntityTypeConfiguration<GrowthMeasurement>
{
    public void Configure(EntityTypeBuilder<GrowthMeasurement> builder)
    {
        builder.Property(g => g.HeightCm).HasPrecision(5, 2);
        builder.Property(g => g.WeightKg).HasPrecision(5, 2);

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_GrowthMeasurement_HeightOrWeight",
            "height_cm IS NOT NULL OR weight_kg IS NOT NULL"));

        builder.HasOne(g => g.RecordedByUser)
            .WithMany(u => u.GrowthMeasurements)
            .HasForeignKey(g => g.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}