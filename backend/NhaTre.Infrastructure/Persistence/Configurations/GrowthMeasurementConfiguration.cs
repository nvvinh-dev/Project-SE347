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

        // Miền số đo là giới hạn chống nhập nhầm, không phải ngưỡng y tế (D51)
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_GrowthMeasurement_HeightOrWeight",
                "height_cm IS NOT NULL OR weight_kg IS NOT NULL");
            t.HasCheckConstraint(
                "CK_GrowthMeasurement_HeightRange",
                "height_cm IS NULL OR (height_cm > 0 AND height_cm <= 200)");
            t.HasCheckConstraint(
                "CK_GrowthMeasurement_WeightRange",
                "weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 100)");
        });

        builder.HasOne(g => g.Child)
            .WithMany(c => c.GrowthMeasurements)
            .HasForeignKey(g => g.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.RecordedByUser)
            .WithMany(u => u.GrowthMeasurements)
            .HasForeignKey(g => g.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}