using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> builder)
    {
        builder.HasOne(i => i.Child)
            .WithMany(c => c.Incidents)
            .HasForeignKey(i => i.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.RecordedByTeacher)
            .WithMany(t => t.Incidents)
            .HasForeignKey(i => i.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}