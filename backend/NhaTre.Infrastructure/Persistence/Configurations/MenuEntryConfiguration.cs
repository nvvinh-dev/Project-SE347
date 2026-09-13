using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class MenuEntryConfiguration : IEntityTypeConfiguration<MenuEntry>
{
    public void Configure(EntityTypeBuilder<MenuEntry> builder)
    {
        builder.HasIndex(m => new { m.WeeklyMenuId, m.DayOfWeek }).IsUnique();
    }
}