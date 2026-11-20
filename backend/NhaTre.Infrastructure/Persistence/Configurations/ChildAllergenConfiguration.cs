using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ChildAllergenConfiguration : IEntityTypeConfiguration<ChildAllergen>
{
    public void Configure(EntityTypeBuilder<ChildAllergen> builder)
    {
        // Khóa chính (child_id, allergen_id) cũng là index cho truy vấn theo trẻ
        builder.HasKey(ca => new { ca.ChildId, ca.AllergenId });

        builder.HasOne(ca => ca.Child)
            .WithMany()
            .HasForeignKey(ca => ca.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ca => ca.Allergen)
            .WithMany()
            .HasForeignKey(ca => ca.AllergenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
