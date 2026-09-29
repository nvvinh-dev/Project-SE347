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
    }
}