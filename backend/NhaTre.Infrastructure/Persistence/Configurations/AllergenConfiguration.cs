using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class AllergenConfiguration : IEntityTypeConfiguration<Allergen>
{
    public void Configure(EntityTypeBuilder<Allergen> builder)
    {
        // Id cố định, không để database tự sinh (D39 mục 19)
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.Code).HasMaxLength(20);

        builder.HasIndex(a => a.Code).IsUnique();

        // Thứ tự khớp Allergens.All: id = vị trí + 1 = sort_order
        builder.HasData(
            new Allergen { Id = 1, Code = Allergens.Milk, Name = "Sữa bò và sản phẩm từ sữa", SortOrder = 1 },
            new Allergen { Id = 2, Code = Allergens.Egg, Name = "Trứng", SortOrder = 2 },
            new Allergen { Id = 3, Code = Allergens.Peanut, Name = "Đậu phộng", SortOrder = 3 },
            new Allergen { Id = 4, Code = Allergens.TreeNut, Name = "Hạt cây (điều, óc chó, hạnh nhân...)", SortOrder = 4 },
            new Allergen { Id = 5, Code = Allergens.Soy, Name = "Đậu nành", SortOrder = 5 },
            new Allergen { Id = 6, Code = Allergens.Wheat, Name = "Lúa mì, gluten", SortOrder = 6 },
            new Allergen { Id = 7, Code = Allergens.Fish, Name = "Cá", SortOrder = 7 },
            new Allergen { Id = 8, Code = Allergens.Crustacean, Name = "Giáp xác (tôm, cua)", SortOrder = 8 },
            new Allergen { Id = 9, Code = Allergens.Mollusc, Name = "Nhuyễn thể (mực, nghêu, sò)", SortOrder = 9 },
            new Allergen { Id = 10, Code = Allergens.Sesame, Name = "Mè", SortOrder = 10 }
        );
    }
}
