using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasIndex(r => r.Name).IsUnique();

        builder.HasData(
            new Role { Id = 1, Name = "Admin" },
            new Role { Id = 2, Name = "Giáo viên" },
            new Role { Id = 3, Name = "Kế toán/Văn phòng" },
            new Role { Id = 4, Name = "Y tế" },
            new Role { Id = 5, Name = "Phụ huynh" }
        );
    }
}