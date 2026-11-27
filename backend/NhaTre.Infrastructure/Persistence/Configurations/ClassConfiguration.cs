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
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Class_AgeRange", "min_age_months <= max_age_months");
            // Sĩ số (D51): rỗng là không giới hạn
            t.HasCheckConstraint("CK_Class_MinCapacity", "min_capacity IS NULL OR min_capacity >= 1");
            t.HasCheckConstraint("CK_Class_MaxCapacity", "max_capacity IS NULL OR max_capacity >= 1");
            t.HasCheckConstraint(
                "CK_Class_CapacityRange",
                "min_capacity IS NULL OR max_capacity IS NULL OR min_capacity <= max_capacity");
        });

        builder.HasOne(c => c.GradeLevel)
            .WithMany()
            .HasForeignKey(c => c.GradeLevelId)
            .OnDelete(DeleteBehavior.Restrict); // D37

        builder.HasOne(c => c.HomeroomTeacher)
            .WithMany(t => t.HomeroomClasses)
            .HasForeignKey(c => c.HomeroomTeacherId)
            .OnDelete(DeleteBehavior.SetNull); // xóa giáo viên không kéo xóa lớp

        // D39 mục 3: ba lớp có sẵn giữ id cố định (migration seed không đổi giữa các máy), mỗi lớp
        // thuộc một khối; Admin tạo thêm lớp qua FR-CLASS-03. Hai cột tuổi giữ giá trị cũ, module lớp ngừng
        // đọc từ FR-CLASS-03
        builder.HasData(
            new Class
            {
                Id = Guid.Parse("e84b9f79-dc69-4aa2-b569-3558337df117"),
                GradeLevelId = 1,
                Name = "Mầm 1",
                MinAgeMonths = 36,
                MaxAgeMonths = 48
            },
            new Class
            {
                Id = Guid.Parse("f8600076-d709-46e9-b658-2b2b1143509d"),
                GradeLevelId = 2,
                Name = "Chồi 1",
                MinAgeMonths = 48,
                MaxAgeMonths = 60
            },
            new Class
            {
                Id = Guid.Parse("f983817a-6f20-400a-b631-b94f1497820f"),
                GradeLevelId = 3,
                Name = "Lá 1",
                MinAgeMonths = 60,
                MaxAgeMonths = 72
            }
        );
    }
}