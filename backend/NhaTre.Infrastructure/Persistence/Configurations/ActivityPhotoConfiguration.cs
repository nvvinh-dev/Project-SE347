using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ActivityPhotoConfiguration : IEntityTypeConfiguration<ActivityPhoto>
{
    public void Configure(EntityTypeBuilder<ActivityPhoto> builder)
    {
        builder.HasOne(a => a.UploadedByTeacher)
            .WithMany(t => t.ActivityPhotos)
            .HasForeignKey(a => a.UploadedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}