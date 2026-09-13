using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class QuickHealthStatusConfiguration : IEntityTypeConfiguration<QuickHealthStatus>
{
    public void Configure(EntityTypeBuilder<QuickHealthStatus> builder)
    {
        builder.HasOne(q => q.RecordedByTeacher)
            .WithMany(t => t.QuickHealthStatuses)
            .HasForeignKey(q => q.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}