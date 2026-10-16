using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.HasIndex(c => c.Name).IsUnique();

        // Một trong hai giới hạn rỗng thì phép so sánh ra NULL và CHECK tự qua.
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Class_AgeRange",
            "min_age_months <= max_age_months"));

        builder.HasOne(c => c.HomeroomTeacher)
            .WithMany(t => t.HomeroomClasses)
            .HasForeignKey(c => c.HomeroomTeacherId)
            .OnDelete(DeleteBehavior.SetNull); // xóa giáo viên không kéo xóa lớp

        // D39 mục 3: đúng 3 lớp cố định, không có chức năng tạo lớp. Id cố định để migration seed
        // không đổi giữa các máy; chưa có giáo viên chủ nhiệm, Admin gán sau
        builder.HasData(
            new Class
            {
                Id = Guid.Parse("e84b9f79-dc69-4aa2-b569-3558337df117"),
                Name = "Lớp Mầm",
                MinAgeMonths = 36,
                MaxAgeMonths = 48
            },
            new Class
            {
                Id = Guid.Parse("f8600076-d709-46e9-b658-2b2b1143509d"),
                Name = "Lớp Chồi",
                MinAgeMonths = 48,
                MaxAgeMonths = 60
            },
            new Class
            {
                Id = Guid.Parse("f983817a-6f20-400a-b631-b94f1497820f"),
                Name = "Lớp Lá",
                MinAgeMonths = 60,
                MaxAgeMonths = 72
            }
        );
    }
}