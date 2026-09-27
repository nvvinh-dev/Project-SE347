using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Configurations;

public class SecurityEventConfiguration : IEntityTypeConfiguration<SecurityEvent>
{
    public void Configure(EntityTypeBuilder<SecurityEvent> builder)
    {
        builder.Property(e => e.OccurredAt).HasDefaultValueSql("now()");

        builder.HasIndex(e => e.OccurredAt);
        builder.HasIndex(e => e.TargetUserId);

        // Danh sách đóng 8 sự kiện của D50
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_SecurityEvent_EventType",
            "event_type IN ('login_succeeded', 'login_failed', 'logout', 'role_changed', " +
            "'account_activation_changed', 'password_reset_by_admin', 'invoice_marked_paid', " +
            "'guardian_link_changed')"));

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(e => e.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(e => e.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
