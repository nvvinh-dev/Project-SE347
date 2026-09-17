using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class PickupConfiguration : IEntityTypeConfiguration<Pickup>
{
    public void Configure(EntityTypeBuilder<Pickup> builder)
    {
        builder.HasIndex(p => p.AttendanceId).IsUnique();

        builder.HasOne(p => p.Attendance)
            .WithOne(a => a.Pickup)
            .HasForeignKey<Pickup>(p => p.AttendanceId);

        builder.HasOne(p => p.RecordedByTeacher)
            .WithMany(t => t.Pickups)
            .HasForeignKey(p => p.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        // PickupPersonId cố ý để nullable: giá trị rỗng mang đúng nghĩa
        // "phụ huynh trực tiếp đón" (D39 mục 11) — không cần cột riêng.
        //
        // OnDelete(Restrict) là BẮT BUỘC ở đây. Mặc định của EF Core cho quan hệ
        // tùy chọn là ClientSetNull: khi phụ huynh xóa một người đón đã đăng ký,
        // EF sẽ âm thầm set pickup_person_id về null trên MỌI bản ghi đón cũ —
        // tức là xóa mất bằng chứng ai đã đón trẻ, biến chúng thành "phụ huynh
        // trực tiếp đón". Restrict buộc phải giữ lại lịch sử, đúng tinh thần D37.
        builder.HasOne(p => p.PickupPerson)
            .WithMany(r => r.Pickups)
            .HasForeignKey(p => p.PickupPersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}