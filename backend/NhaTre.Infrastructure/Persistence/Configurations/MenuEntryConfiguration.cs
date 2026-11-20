using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class MenuEntryConfiguration : IEntityTypeConfiguration<MenuEntry>
{
    public void Configure(EntityTypeBuilder<MenuEntry> builder)
    {
        builder.HasIndex(m => new { m.WeeklyMenuId, m.DayOfWeek }).IsUnique();

        // Mặc định now() để điền dòng đã có lúc thêm cột và dòng mới tạo; module thực đơn tự đổi giá trị
        // khi mô tả hoặc dị nguyên của ngày đổi (FR-MENU-03, D39 mục 19)
        builder.Property(m => m.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasOne(m => m.WeeklyMenu)
            .WithMany(w => w.MenuEntries)
            .HasForeignKey(m => m.WeeklyMenuId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}