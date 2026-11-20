using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class MenuEntryAllergenConfiguration : IEntityTypeConfiguration<MenuEntryAllergen>
{
    public void Configure(EntityTypeBuilder<MenuEntryAllergen> builder)
    {
        // Khóa chính (menu_entry_id, allergen_id) cũng là index cho truy vấn theo ngày thực đơn
        builder.HasKey(ma => new { ma.MenuEntryId, ma.AllergenId });

        // Restrict: ngày bị gỡ khỏi thực đơn thì xóa dòng của ngày đó trước (D39 mục 19)
        builder.HasOne(ma => ma.MenuEntry)
            .WithMany()
            .HasForeignKey(ma => ma.MenuEntryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ma => ma.Allergen)
            .WithMany()
            .HasForeignKey(ma => ma.AllergenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
