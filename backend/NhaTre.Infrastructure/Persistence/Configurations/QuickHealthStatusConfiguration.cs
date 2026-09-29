using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class QuickHealthStatusConfiguration : IEntityTypeConfiguration<QuickHealthStatus>
{
    public void Configure(EntityTypeBuilder<QuickHealthStatus> builder)
    {
        // D39 mục 1: giới hạn độ dài Mood đủ chứa giá trị dài nhất ("Normal").
        builder.Property(q => q.Mood)
            .HasMaxLength(20);

        // Nhiệt độ cơ thể: tối đa 3 chữ số phần nguyên + 1 chữ số thập phân (VD: 38.5).
        builder.Property(q => q.TemperatureCelsius)
            .HasPrecision(4, 1);

        // D51: validator ở Application vẫn là nơi kiểm tra chính; CHECK chặn các đường
        // ghi không qua validator. Danh sách mood phải khớp HealthMoods.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_QuickHealthStatus_Mood",
                "mood IN ('Happy', 'Normal', 'Tired', 'Fussy')");
            t.HasCheckConstraint(
                "CK_QuickHealthStatus_TemperatureRange",
                "temperature_celsius IS NULL OR temperature_celsius BETWEEN 30 AND 45");
        });

        builder.HasOne(q => q.Child)
            .WithMany(c => c.QuickHealthStatuses)
            .HasForeignKey(q => q.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.RecordedByTeacher)
            .WithMany(t => t.QuickHealthStatuses)
            .HasForeignKey(q => q.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}