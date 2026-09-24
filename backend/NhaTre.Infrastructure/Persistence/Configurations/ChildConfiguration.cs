using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ChildConfiguration : IEntityTypeConfiguration<Child>
{
    public void Configure(EntityTypeBuilder<Child> builder)
    {
        // D39 mục 14: văn bản tự do, cho phép rỗng, tối đa 1000 ký tự
        builder.Property(c => c.HealthNotes)
            .HasMaxLength(1000);
    }
}
