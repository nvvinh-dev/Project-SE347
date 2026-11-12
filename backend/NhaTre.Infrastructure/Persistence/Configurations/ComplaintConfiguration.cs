using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class ComplaintConfiguration : IEntityTypeConfiguration<Complaint>
{
    public void Configure(EntityTypeBuilder<Complaint> builder)
    {
        builder.Property(c => c.Status).HasMaxLength(20);

        // child_id: phụ huynh xem phản ánh của con; status: Admin lọc phản ánh mới
        builder.HasIndex(c => c.ChildId);
        builder.HasIndex(c => c.Status);

        // D51: validator vẫn là nơi kiểm tra chính; CHECK chặn các đường ghi không qua validator.
        // Danh sách phải khớp ComplaintStatuses.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Complaint_Status", "status IN ('New', 'InProgress', 'Resolved')");
            t.HasCheckConstraint(
                "CK_Complaint_Resolution",
                "status <> 'Resolved' OR (resolution IS NOT NULL AND resolution <> '')");
        });

        builder.HasOne(c => c.Child)
            .WithMany()
            .HasForeignKey(c => c.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.SubmittedByUser)
            .WithMany()
            .HasForeignKey(c => c.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.HandledByUser)
            .WithMany()
            .HasForeignKey(c => c.HandledByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
