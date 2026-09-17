using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHealthMoodAndTemperature_RestrictPickupPerson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups");

            migrationBuilder.AddColumn<string>(
                name: "mood",
                table: "quick_health_statuses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false);
            // Cố ý BỎ defaultValue mà EF sinh ra: bảng quick_health_statuses đang rỗng
            // (chưa có endpoint nào ghi vào) nên không cần backfill. Để lại DEFAULT ''
            // sẽ khiến lỗi quên set Mood âm thầm ghi chuỗi rỗng thay vì báo lỗi ngay.

            migrationBuilder.AddColumn<decimal>(
                name: "temperature_celsius",
                table: "quick_health_statuses",
                type: "numeric(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups",
                column: "pickup_person_id",
                principalTable: "registered_pickup_persons",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups");

            migrationBuilder.DropColumn(
                name: "mood",
                table: "quick_health_statuses");

            migrationBuilder.DropColumn(
                name: "temperature_celsius",
                table: "quick_health_statuses");

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups",
                column: "pickup_person_id",
                principalTable: "registered_pickup_persons",
                principalColumn: "id");
        }
    }
}
