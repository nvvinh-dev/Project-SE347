using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ChildGuardianConfiguration : IEntityTypeConfiguration<ChildGuardian>
{
    public void Configure(EntityTypeBuilder<ChildGuardian> builder)
    {
        builder.HasKey(cg => new { cg.ChildId, cg.GuardianUserId });

        builder.HasOne(cg => cg.Child)
            .WithMany(c => c.ChildGuardians)
            .HasForeignKey(cg => cg.ChildId);

        builder.HasOne(cg => cg.GuardianUser)
            .WithMany(u => u.ChildGuardians)
            .HasForeignKey(cg => cg.GuardianUserId);
    }
}