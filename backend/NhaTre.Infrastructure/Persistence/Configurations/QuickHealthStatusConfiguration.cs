using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class QuickHealthStatusConfiguration : IEntityTypeConfiguration<QuickHealthStatus>
{
    public void Configure(EntityTypeBuilder<QuickHealthStatus> builder)
    {
        // D39 mục 1: giới hạn độ dài Mood đủ chứa giá trị dài nhất ("Normal").
        // KHÔNG đặt CHECK constraint ở database — việc chặn 4 giá trị hợp lệ
        // do validator ở tầng Application lo, cùng cách làm với attendances.status (D23).
        builder.Property(q => q.Mood)
            .HasMaxLength(20);

        // Nhiệt độ cơ thể: tối đa 3 chữ số phần nguyên + 1 chữ số thập phân (VD: 38.5).
        builder.Property(q => q.TemperatureCelsius)
            .HasPrecision(4, 1);

        builder.HasOne(q => q.RecordedByTeacher)
            .WithMany(t => t.QuickHealthStatuses)
            .HasForeignKey(q => q.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}