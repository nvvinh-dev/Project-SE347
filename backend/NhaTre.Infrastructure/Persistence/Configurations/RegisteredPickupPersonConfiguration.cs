using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class RegisteredPickupPersonConfiguration : IEntityTypeConfiguration<RegisteredPickupPerson>
{
    public void Configure(EntityTypeBuilder<RegisteredPickupPerson> builder)
    {
        builder.HasOne(r => r.Child)
            .WithMany(c => c.RegisteredPickupPersons)
            .HasForeignKey(r => r.ChildId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
