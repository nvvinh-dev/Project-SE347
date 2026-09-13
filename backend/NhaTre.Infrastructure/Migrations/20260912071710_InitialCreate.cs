using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tuition_fees",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tuition_fees", x => x.id);
                    table.CheckConstraint("CK_TuitionFee_AmountPositive", "amount > 0");
                });

            migrationBuilder.CreateTable(
                name: "weekly_menus",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    week_start_date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_weekly_menus", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<short>(type: "smallint", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    login_identifier = table.Column<string>(type: "text", nullable: false),
                    credential_reference = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.ForeignKey(
                        name: "fk_users_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "menu_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    weekly_menu_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<short>(type: "smallint", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_menu_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_menu_entries_weekly_menus_weekly_menu_id",
                        column: x => x.weekly_menu_id,
                        principalTable: "weekly_menus",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_users_recipient_user_id",
                        column: x => x.recipient_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "teachers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_teachers", x => x.id);
                    table.ForeignKey(
                        name: "fk_teachers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "classes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    homeroom_teacher_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "text", nullable: false),
                    min_age_months = table.Column<int>(type: "integer", nullable: true),
                    max_age_months = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_classes", x => x.id);
                    table.ForeignKey(
                        name: "fk_classes_teachers_homeroom_teacher_id",
                        column: x => x.homeroom_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "activity_photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    file_reference = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_activity_photos", x => x.id);
                    table.ForeignKey(
                        name: "fk_activity_photos_classes_class_id",
                        column: x => x.class_id,
                        principalTable: "classes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_activity_photos_teachers_uploaded_by_teacher_id",
                        column: x => x.uploaded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "children",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    class_id = table.Column<Guid>(type: "uuid", nullable: true),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    date_of_birth = table.Column<DateOnly>(type: "date", nullable: false),
                    enrollment_date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_children", x => x.id);
                    table.ForeignKey(
                        name: "fk_children_classes_class_id",
                        column: x => x.class_id,
                        principalTable: "classes",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "attendances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    attendance_date = table.Column<DateOnly>(type: "date", nullable: false),
                    check_in_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_attendances", x => x.id);
                    table.ForeignKey(
                        name: "fk_attendances_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_attendances_teachers_recorded_by_teacher_id",
                        column: x => x.recorded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "child_guardians",
                columns: table => new
                {
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    guardian_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_child_guardians", x => new { x.child_id, x.guardian_user_id });
                    table.ForeignKey(
                        name: "fk_child_guardians_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_child_guardians_users_guardian_user_id",
                        column: x => x.guardian_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "growth_measurements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    measured_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    height_cm = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_growth_measurements", x => x.id);
                    table.CheckConstraint("CK_GrowthMeasurement_HeightOrWeight", "height_cm IS NOT NULL OR weight_kg IS NOT NULL");
                    table.ForeignKey(
                        name: "fk_growth_measurements_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_growth_measurements_users_recorded_by_user_id",
                        column: x => x.recorded_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "incidents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_incidents", x => x.id);
                    table.ForeignKey(
                        name: "fk_incidents_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_incidents_teachers_recorded_by_teacher_id",
                        column: x => x.recorded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tuition_fee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    issued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_invoices", x => x.id);
                    table.CheckConstraint("CK_Invoice_AmountPositive", "amount > 0");
                    table.CheckConstraint("CK_Invoice_Status", "status IN ('unpaid', 'paid')");
                    table.ForeignKey(
                        name: "fk_invoices_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_invoices_tuition_fees_tuition_fee_id",
                        column: x => x.tuition_fee_id,
                        principalTable: "tuition_fees",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "quick_health_statuses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quick_health_statuses", x => x.id);
                    table.ForeignKey(
                        name: "fk_quick_health_statuses_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_quick_health_statuses_teachers_recorded_by_teacher_id",
                        column: x => x.recorded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "registered_pickup_persons",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_registered_pickup_persons", x => x.id);
                    table.ForeignKey(
                        name: "fk_registered_pickup_persons_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "incident_photos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    incident_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_reference = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_incident_photos", x => x.id);
                    table.ForeignKey(
                        name: "fk_incident_photos_incidents_incident_id",
                        column: x => x.incident_id,
                        principalTable: "incidents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    external_reference = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_payments", x => x.id);
                    table.CheckConstraint("CK_Payment_AmountPositive", "amount > 0");
                    table.ForeignKey(
                        name: "fk_payments_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pickups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    attendance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pickup_person_id = table.Column<Guid>(type: "uuid", nullable: true),
                    pickup_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pickups", x => x.id);
                    table.ForeignKey(
                        name: "fk_pickups_attendances_attendance_id",
                        column: x => x.attendance_id,
                        principalTable: "attendances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                        column: x => x.pickup_person_id,
                        principalTable: "registered_pickup_persons",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_pickups_teachers_recorded_by_teacher_id",
                        column: x => x.recorded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_activity_photos_class_id",
                table: "activity_photos",
                column: "class_id");

            migrationBuilder.CreateIndex(
                name: "ix_activity_photos_uploaded_by_teacher_id",
                table: "activity_photos",
                column: "uploaded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_attendances_child_id_attendance_date",
                table: "attendances",
                columns: new[] { "child_id", "attendance_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_attendances_recorded_by_teacher_id",
                table: "attendances",
                column: "recorded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_child_guardians_guardian_user_id",
                table: "child_guardians",
                column: "guardian_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_children_class_id",
                table: "children",
                column: "class_id");

            migrationBuilder.CreateIndex(
                name: "ix_classes_homeroom_teacher_id",
                table: "classes",
                column: "homeroom_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_classes_name",
                table: "classes",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_growth_measurements_child_id",
                table: "growth_measurements",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_growth_measurements_recorded_by_user_id",
                table: "growth_measurements",
                column: "recorded_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_incident_photos_incident_id",
                table: "incident_photos",
                column: "incident_id");

            migrationBuilder.CreateIndex(
                name: "ix_incidents_child_id",
                table: "incidents",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_incidents_recorded_by_teacher_id",
                table: "incidents",
                column: "recorded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_invoices_child_id",
                table: "invoices",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_invoices_tuition_fee_id",
                table: "invoices",
                column: "tuition_fee_id");

            migrationBuilder.CreateIndex(
                name: "ix_menu_entries_weekly_menu_id_day_of_week",
                table: "menu_entries",
                columns: new[] { "weekly_menu_id", "day_of_week" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_user_id",
                table: "notifications",
                column: "recipient_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_payments_invoice_id",
                table: "payments",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "ix_pickups_attendance_id",
                table: "pickups",
                column: "attendance_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pickups_pickup_person_id",
                table: "pickups",
                column: "pickup_person_id");

            migrationBuilder.CreateIndex(
                name: "ix_pickups_recorded_by_teacher_id",
                table: "pickups",
                column: "recorded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_quick_health_statuses_child_id",
                table: "quick_health_statuses",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_quick_health_statuses_recorded_by_teacher_id",
                table: "quick_health_statuses",
                column: "recorded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_registered_pickup_persons_child_id",
                table: "registered_pickup_persons",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_teachers_user_id",
                table: "teachers",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_login_identifier",
                table: "users",
                column: "login_identifier",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_role_id",
                table: "users",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "ix_weekly_menus_week_start_date",
                table: "weekly_menus",
                column: "week_start_date",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "activity_photos");

            migrationBuilder.DropTable(
                name: "child_guardians");

            migrationBuilder.DropTable(
                name: "growth_measurements");

            migrationBuilder.DropTable(
                name: "incident_photos");

            migrationBuilder.DropTable(
                name: "menu_entries");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "pickups");

            migrationBuilder.DropTable(
                name: "quick_health_statuses");

            migrationBuilder.DropTable(
                name: "incidents");

            migrationBuilder.DropTable(
                name: "weekly_menus");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "attendances");

            migrationBuilder.DropTable(
                name: "registered_pickup_persons");

            migrationBuilder.DropTable(
                name: "tuition_fees");

            migrationBuilder.DropTable(
                name: "children");

            migrationBuilder.DropTable(
                name: "classes");

            migrationBuilder.DropTable(
                name: "teachers");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
