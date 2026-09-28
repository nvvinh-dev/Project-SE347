using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenVersionSecurityEventsAndConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_activity_photos_classes_class_id",
                table: "activity_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_attendances_children_child_id",
                table: "attendances");

            migrationBuilder.DropForeignKey(
                name: "fk_child_guardians_children_child_id",
                table: "child_guardians");

            migrationBuilder.DropForeignKey(
                name: "fk_child_guardians_users_guardian_user_id",
                table: "child_guardians");

            migrationBuilder.DropForeignKey(
                name: "fk_growth_measurements_children_child_id",
                table: "growth_measurements");

            migrationBuilder.DropForeignKey(
                name: "fk_incident_photos_incidents_incident_id",
                table: "incident_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_incidents_children_child_id",
                table: "incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_invoices_children_child_id",
                table: "invoices");

            migrationBuilder.DropForeignKey(
                name: "fk_menu_entries_weekly_menus_weekly_menu_id",
                table: "menu_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications_users_recipient_user_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "fk_payments_invoices_invoice_id",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "fk_pickups_attendances_attendance_id",
                table: "pickups");

            migrationBuilder.DropForeignKey(
                name: "fk_quick_health_statuses_children_child_id",
                table: "quick_health_statuses");

            migrationBuilder.DropForeignKey(
                name: "fk_registered_pickup_persons_children_child_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropForeignKey(
                name: "fk_teachers_users_user_id",
                table: "teachers");

            migrationBuilder.AddColumn<int>(
                name: "token_version",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "security_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    event_type = table.Column<string>(type: "text", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    target_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    target_reference = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "text", nullable: true),
                    detail = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_security_events", x => x.id);
                    table.CheckConstraint("CK_SecurityEvent_EventType", "event_type IN ('login_succeeded', 'login_failed', 'logout', 'role_changed', 'account_activation_changed', 'password_reset_by_admin', 'invoice_marked_paid', 'guardian_link_changed')");
                    table.ForeignKey(
                        name: "fk_security_events_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_security_events_users_target_user_id",
                        column: x => x.target_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Mọi bảng trong schema public bật RLS, không có policy: chặn Data API của
            // Supabase. Backend kết nối bằng postgres (BYPASSRLS) nên không bị ảnh hưởng.
            migrationBuilder.Sql("ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QuickHealthStatus_Mood",
                table: "quick_health_statuses",
                sql: "mood IN ('Happy', 'Normal', 'Tired', 'Fussy')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QuickHealthStatus_TemperatureRange",
                table: "quick_health_statuses",
                sql: "temperature_celsius IS NULL OR temperature_celsius BETWEEN 30 AND 45");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GrowthMeasurement_HeightRange",
                table: "growth_measurements",
                sql: "height_cm IS NULL OR (height_cm > 0 AND height_cm <= 200)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GrowthMeasurement_WeightRange",
                table: "growth_measurements",
                sql: "weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 100)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Class_AgeRange",
                table: "classes",
                sql: "min_age_months <= max_age_months");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Attendance_Status",
                table: "attendances",
                sql: "status IN ('Present', 'AbsentExcused', 'AbsentUnexcused')");

            migrationBuilder.CreateIndex(
                name: "ix_security_events_actor_user_id",
                table: "security_events",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_security_events_occurred_at",
                table: "security_events",
                column: "occurred_at");

            migrationBuilder.CreateIndex(
                name: "ix_security_events_target_user_id",
                table: "security_events",
                column: "target_user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_activity_photos_classes_class_id",
                table: "activity_photos",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_attendances_children_child_id",
                table: "attendances",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_child_guardians_children_child_id",
                table: "child_guardians",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_child_guardians_users_guardian_user_id",
                table: "child_guardians",
                column: "guardian_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_growth_measurements_children_child_id",
                table: "growth_measurements",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_incident_photos_incidents_incident_id",
                table: "incident_photos",
                column: "incident_id",
                principalTable: "incidents",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_incidents_children_child_id",
                table: "incidents",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_invoices_children_child_id",
                table: "invoices",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_menu_entries_weekly_menus_weekly_menu_id",
                table: "menu_entries",
                column: "weekly_menu_id",
                principalTable: "weekly_menus",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications_users_recipient_user_id",
                table: "notifications",
                column: "recipient_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_payments_invoices_invoice_id",
                table: "payments",
                column: "invoice_id",
                principalTable: "invoices",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_attendances_attendance_id",
                table: "pickups",
                column: "attendance_id",
                principalTable: "attendances",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_quick_health_statuses_children_child_id",
                table: "quick_health_statuses",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_registered_pickup_persons_children_child_id",
                table: "registered_pickup_persons",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_teachers_users_user_id",
                table: "teachers",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_activity_photos_classes_class_id",
                table: "activity_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_attendances_children_child_id",
                table: "attendances");

            migrationBuilder.DropForeignKey(
                name: "fk_child_guardians_children_child_id",
                table: "child_guardians");

            migrationBuilder.DropForeignKey(
                name: "fk_child_guardians_users_guardian_user_id",
                table: "child_guardians");

            migrationBuilder.DropForeignKey(
                name: "fk_growth_measurements_children_child_id",
                table: "growth_measurements");

            migrationBuilder.DropForeignKey(
                name: "fk_incident_photos_incidents_incident_id",
                table: "incident_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_incidents_children_child_id",
                table: "incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_invoices_children_child_id",
                table: "invoices");

            migrationBuilder.DropForeignKey(
                name: "fk_menu_entries_weekly_menus_weekly_menu_id",
                table: "menu_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_notifications_users_recipient_user_id",
                table: "notifications");

            migrationBuilder.DropForeignKey(
                name: "fk_payments_invoices_invoice_id",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "fk_pickups_attendances_attendance_id",
                table: "pickups");

            migrationBuilder.DropForeignKey(
                name: "fk_quick_health_statuses_children_child_id",
                table: "quick_health_statuses");

            migrationBuilder.DropForeignKey(
                name: "fk_registered_pickup_persons_children_child_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropForeignKey(
                name: "fk_teachers_users_user_id",
                table: "teachers");

            migrationBuilder.DropTable(
                name: "security_events");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QuickHealthStatus_Mood",
                table: "quick_health_statuses");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QuickHealthStatus_TemperatureRange",
                table: "quick_health_statuses");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GrowthMeasurement_HeightRange",
                table: "growth_measurements");

            migrationBuilder.DropCheckConstraint(
                name: "CK_GrowthMeasurement_WeightRange",
                table: "growth_measurements");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Class_AgeRange",
                table: "classes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Attendance_Status",
                table: "attendances");

            migrationBuilder.DropColumn(
                name: "token_version",
                table: "users");

            migrationBuilder.AddForeignKey(
                name: "fk_activity_photos_classes_class_id",
                table: "activity_photos",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_attendances_children_child_id",
                table: "attendances",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_child_guardians_children_child_id",
                table: "child_guardians",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_child_guardians_users_guardian_user_id",
                table: "child_guardians",
                column: "guardian_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_growth_measurements_children_child_id",
                table: "growth_measurements",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_incident_photos_incidents_incident_id",
                table: "incident_photos",
                column: "incident_id",
                principalTable: "incidents",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_incidents_children_child_id",
                table: "incidents",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_invoices_children_child_id",
                table: "invoices",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_menu_entries_weekly_menus_weekly_menu_id",
                table: "menu_entries",
                column: "weekly_menu_id",
                principalTable: "weekly_menus",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_notifications_users_recipient_user_id",
                table: "notifications",
                column: "recipient_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_payments_invoices_invoice_id",
                table: "payments",
                column: "invoice_id",
                principalTable: "invoices",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_attendances_attendance_id",
                table: "pickups",
                column: "attendance_id",
                principalTable: "attendances",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_quick_health_statuses_children_child_id",
                table: "quick_health_statuses",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_registered_pickup_persons_children_child_id",
                table: "registered_pickup_persons",
                column: "child_id",
                principalTable: "children",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_teachers_users_user_id",
                table: "teachers",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
