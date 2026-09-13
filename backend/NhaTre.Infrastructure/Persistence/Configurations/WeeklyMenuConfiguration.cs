using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class WeeklyMenuConfiguration : IEntityTypeConfiguration<WeeklyMenu>
{
    public void Configure(EntityTypeBuilder<WeeklyMenu> builder)
    {
        builder.HasIndex(w => w.WeekStartDate).IsUnique();
    }
}