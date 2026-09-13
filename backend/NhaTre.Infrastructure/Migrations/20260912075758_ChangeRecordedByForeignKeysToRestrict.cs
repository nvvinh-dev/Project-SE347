using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeRecordedByForeignKeysToRestrict : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_activity_photos_teachers_uploaded_by_teacher_id",
                table: "activity_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_attendances_teachers_recorded_by_teacher_id",
                table: "attendances");

            migrationBuilder.DropForeignKey(
                name: "fk_growth_measurements_users_recorded_by_user_id",
                table: "growth_measurements");

            migrationBuilder.DropForeignKey(
                name: "fk_incidents_teachers_recorded_by_teacher_id",
                table: "incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_pickups_teachers_recorded_by_teacher_id",
                table: "pickups");

            migrationBuilder.DropForeignKey(
                name: "fk_quick_health_statuses_teachers_recorded_by_teacher_id",
                table: "quick_health_statuses");

            migrationBuilder.DropForeignKey(
                name: "fk_users_roles_role_id",
                table: "users");

            migrationBuilder.AddForeignKey(
                name: "fk_activity_photos_teachers_uploaded_by_teacher_id",
                table: "activity_photos",
                column: "uploaded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_attendances_teachers_recorded_by_teacher_id",
                table: "attendances",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_growth_measurements_users_recorded_by_user_id",
                table: "growth_measurements",
                column: "recorded_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_incidents_teachers_recorded_by_teacher_id",
                table: "incidents",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_teachers_recorded_by_teacher_id",
                table: "pickups",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_quick_health_statuses_teachers_recorded_by_teacher_id",
                table: "quick_health_statuses",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_users_roles_role_id",
                table: "users",
                column: "role_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_activity_photos_teachers_uploaded_by_teacher_id",
                table: "activity_photos");

            migrationBuilder.DropForeignKey(
                name: "fk_attendances_teachers_recorded_by_teacher_id",
                table: "attendances");

            migrationBuilder.DropForeignKey(
                name: "fk_growth_measurements_users_recorded_by_user_id",
                table: "growth_measurements");

            migrationBuilder.DropForeignKey(
                name: "fk_incidents_teachers_recorded_by_teacher_id",
                table: "incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_pickups_teachers_recorded_by_teacher_id",
                table: "pickups");

            migrationBuilder.DropForeignKey(
                name: "fk_quick_health_statuses_teachers_recorded_by_teacher_id",
                table: "quick_health_statuses");

            migrationBuilder.DropForeignKey(
                name: "fk_users_roles_role_id",
                table: "users");

            migrationBuilder.AddForeignKey(
                name: "fk_activity_photos_teachers_uploaded_by_teacher_id",
                table: "activity_photos",
                column: "uploaded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_attendances_teachers_recorded_by_teacher_id",
                table: "attendances",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_growth_measurements_users_recorded_by_user_id",
                table: "growth_measurements",
                column: "recorded_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_incidents_teachers_recorded_by_teacher_id",
                table: "incidents",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_teachers_recorded_by_teacher_id",
                table: "pickups",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_quick_health_statuses_teachers_recorded_by_teacher_id",
                table: "quick_health_statuses",
                column: "recorded_by_teacher_id",
                principalTable: "teachers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_users_roles_role_id",
                table: "users",
                column: "role_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
