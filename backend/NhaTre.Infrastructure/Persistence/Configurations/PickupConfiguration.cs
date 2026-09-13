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
    }
}