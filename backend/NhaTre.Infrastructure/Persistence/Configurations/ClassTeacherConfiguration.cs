using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ClassTeacherConfiguration : IEntityTypeConfiguration<ClassTeacher>
{
    public void Configure(EntityTypeBuilder<ClassTeacher> builder)
    {
        // Khóa chính (class_id, teacher_id) cũng là index cho truy vấn theo lớp
        builder.HasKey(ct => new { ct.ClassId, ct.TeacherId });

        // BR-SCOPE-02: tìm các lớp một giáo viên làm giáo viên phụ
        builder.HasIndex(ct => ct.TeacherId);

        builder.HasOne(ct => ct.Class)
            .WithMany(c => c.AssistantTeachers)
            .HasForeignKey(ct => ct.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ct => ct.Teacher)
            .WithMany(t => t.AssistantClasses)
            .HasForeignKey(ct => ct.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
