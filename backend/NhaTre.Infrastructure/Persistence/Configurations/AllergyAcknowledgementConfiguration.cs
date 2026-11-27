using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class AllergyAcknowledgementConfiguration : IEntityTypeConfiguration<AllergyAcknowledgement>
{
    public void Configure(EntityTypeBuilder<AllergyAcknowledgement> builder)
    {
        // Tìm lần xác nhận hôm nay của trẻ (D39 mục 19)
        builder.HasIndex(a => new { a.ChildId, a.AckDate });

        builder.HasOne(a => a.Child)
            .WithMany()
            .HasForeignKey(a => a.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        // Người xác nhận (D37)
        builder.HasOne(a => a.AcknowledgedByTeacher)
            .WithMany()
            .HasForeignKey(a => a.AcknowledgedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
