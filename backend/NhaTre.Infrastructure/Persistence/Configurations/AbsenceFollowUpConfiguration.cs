using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class AbsenceFollowUpConfiguration : IEntityTypeConfiguration<AbsenceFollowUp>
{
    public void Configure(EntityTypeBuilder<AbsenceFollowUp> builder)
    {
        builder.Property(f => f.Outcome).HasMaxLength(20);
        builder.Property(f => f.Note).HasMaxLength(500);

        // Các lần liên hệ của một bản điểm danh (D39 mục 20)
        builder.HasIndex(f => f.AttendanceId);

        // D51: validator vẫn là nơi kiểm tra chính; CHECK chặn các đường ghi không qua validator.
        // Danh sách phải khớp AbsenceFollowUpOutcomes.
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_AbsenceFollowUp_Outcome", "outcome IN ('Reached', 'Unreachable')");
            t.HasCheckConstraint("CK_AbsenceFollowUp_ReachedNote", "outcome <> 'Reached' OR note IS NOT NULL");
        });

        builder.HasOne(f => f.Attendance)
            .WithMany()
            .HasForeignKey(f => f.AttendanceId)
            .OnDelete(DeleteBehavior.Restrict);

        // Người ghi nhận (D37)
        builder.HasOne(f => f.RecordedByTeacher)
            .WithMany()
            .HasForeignKey(f => f.RecordedByTeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
