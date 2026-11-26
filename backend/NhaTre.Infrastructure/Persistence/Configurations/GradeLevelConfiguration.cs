using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class GradeLevelConfiguration : IEntityTypeConfiguration<GradeLevel>
{
    public void Configure(EntityTypeBuilder<GradeLevel> builder)
    {
        // Id cố định, không để database tự sinh (D39 mục 3)
        builder.Property(g => g.Id).ValueGeneratedNever();

        builder.HasIndex(g => g.Name).IsUnique();

        // Khoảng tuổi nửa mở nên tối thiểu phải nhỏ hơn hẳn tối đa (D51)
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_GradeLevel_AgeRange",
            "min_age_months < max_age_months"));

        // D39 mục 3: đúng 3 khối, không có API tạo, sửa hay bỏ khối; id = sort_order
        builder.HasData(
            new GradeLevel { Id = 1, Name = "Mầm", MinAgeMonths = 36, MaxAgeMonths = 48, SortOrder = 1 },
            new GradeLevel { Id = 2, Name = "Chồi", MinAgeMonths = 48, MaxAgeMonths = 60, SortOrder = 2 },
            new GradeLevel { Id = 3, Name = "Lá", MinAgeMonths = 60, MaxAgeMonths = 72, SortOrder = 3 }
        );
    }
}
