using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.HasIndex(a => new { a.ChildId, a.AttendanceDate }).IsUnique();

        builder.HasOne(a => a.RecordedByTeacher)
            .WithMany(t => t.Attendances)
            .HasForeignKey(a => a.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}