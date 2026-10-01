using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class PickupConfiguration : IEntityTypeConfiguration<Pickup>
{
    public void Configure(EntityTypeBuilder<Pickup> builder)
    {
        builder.HasIndex(p => p.AttendanceId).IsUnique();

        builder.Property(p => p.PickupMethod).HasMaxLength(20);

        // D51: validator vẫn là nơi kiểm tra chính; CHECK chặn các đường ghi không qua validator.
        // Danh sách phải khớp PickupMethods.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Pickup_Method",
                "pickup_method IN ('Primary', 'Backup', 'PhoneConfirmed')");
            t.HasCheckConstraint(
                "CK_Pickup_ConfirmedByName",
                "(pickup_method = 'PhoneConfirmed' AND confirmed_by_name IS NOT NULL AND confirmed_by_name <> '') " +
                "OR (pickup_method <> 'PhoneConfirmed' AND confirmed_by_name IS NULL)");
        });

        builder.HasOne(p => p.Attendance)
            .WithOne(a => a.Pickup)
            .HasForeignKey<Pickup>(p => p.AttendanceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.RecordedByTeacher)
            .WithMany(t => t.Pickups)
            .HasForeignKey(p => p.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        // Không có khóa ngoại tới registered_pickup_persons: họ tên được chép vào bản ghi lúc đón,
        // nên phụ huynh thay hay xóa người đón thì lịch sử ai đã đón trẻ vẫn giữ nguyên (D24).
    }
}