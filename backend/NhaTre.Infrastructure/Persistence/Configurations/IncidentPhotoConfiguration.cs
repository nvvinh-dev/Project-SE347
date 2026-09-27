using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class IncidentPhotoConfiguration : IEntityTypeConfiguration<IncidentPhoto>
{
    public void Configure(EntityTypeBuilder<IncidentPhoto> builder)
    {
        builder.HasOne(p => p.Incident)
            .WithMany(i => i.IncidentPhotos)
            .HasForeignKey(p => p.IncidentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
