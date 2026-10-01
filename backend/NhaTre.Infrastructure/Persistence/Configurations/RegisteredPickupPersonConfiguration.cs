using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class RegisteredPickupPersonConfiguration : IEntityTypeConfiguration<RegisteredPickupPerson>
{
    public void Configure(EntityTypeBuilder<RegisteredPickupPerson> builder)
    {
        builder.Property(r => r.FullName).HasMaxLength(100);
        builder.Property(r => r.Relationship).HasMaxLength(50);
        builder.Property(r => r.PhoneNumber).HasMaxLength(10);
        builder.Property(r => r.CitizenIdNumber).HasMaxLength(12);

        // Mỗi trẻ tối đa một người đón chính và một người dự phòng (D24)
        builder.HasIndex(r => new { r.ChildId, r.Priority }).IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_RegisteredPickupPerson_Priority",
            "priority IN (1, 2)"));

        builder.HasOne(r => r.Child)
            .WithMany(c => c.RegisteredPickupPersons)
            .HasForeignKey(r => r.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bằng chứng ai đã xác nhận đồng ý cung cấp thông tin (D24, D37)
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.ConsentConfirmedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
