using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.HasIndex(a => new { a.ChildId, a.AttendanceDate }).IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Attendance_Status",
            "status IN ('Present', 'AbsentExcused', 'AbsentUnexcused')"));

        builder.HasOne(a => a.Child)
            .WithMany(c => c.Attendances)
            .HasForeignKey(a => a.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.RecordedByTeacher)
            .WithMany(t => t.Attendances)
            .HasForeignKey(a => a.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}