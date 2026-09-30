using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePickupsAndRegisteredPickupPersons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cố ý bỏ defaultValue EF sinh ra: registered_pickup_persons và pickups đang rỗng
            // (đã kiểm tra 30/09), không cần backfill. Để DEFAULT '' hay Guid rỗng sẽ khiến lỗi
            // quên gán giá trị âm thầm ghi dữ liệu rác thay vì báo lỗi ngay.

            migrationBuilder.DropForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups");

            migrationBuilder.DropIndex(
                name: "ix_registered_pickup_persons_child_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropIndex(
                name: "ix_pickups_pickup_person_id",
                table: "pickups");

            migrationBuilder.DropColumn(
                name: "pickup_person_id",
                table: "pickups");

            migrationBuilder.AlterColumn<string>(
                name: "full_name",
                table: "registered_pickup_persons",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "citizen_id_number",
                table: "registered_pickup_persons",
                type: "character varying(12)",
                maxLength: 12,
                nullable: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "consent_confirmed_at",
                table: "registered_pickup_persons",
                type: "timestamp with time zone",
                nullable: false);

            migrationBuilder.AddColumn<Guid>(
                name: "consent_confirmed_by_user_id",
                table: "registered_pickup_persons",
                type: "uuid",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "face_photo_reference",
                table: "registered_pickup_persons",
                type: "text",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                table: "registered_pickup_persons",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false);

            migrationBuilder.AddColumn<short>(
                name: "priority",
                table: "registered_pickup_persons",
                type: "smallint",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "relationship",
                table: "registered_pickup_persons",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "confirmed_by_name",
                table: "pickups",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "picker_full_name",
                table: "pickups",
                type: "text",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "pickup_method",
                table: "pickups",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "ix_registered_pickup_persons_child_id_priority",
                table: "registered_pickup_persons",
                columns: new[] { "child_id", "priority" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_registered_pickup_persons_consent_confirmed_by_user_id",
                table: "registered_pickup_persons",
                column: "consent_confirmed_by_user_id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_RegisteredPickupPerson_Priority",
                table: "registered_pickup_persons",
                sql: "priority IN (1, 2)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Pickup_ConfirmedByName",
                table: "pickups",
                sql: "(pickup_method = 'PhoneConfirmed' AND confirmed_by_name IS NOT NULL AND confirmed_by_name <> '') OR (pickup_method <> 'PhoneConfirmed' AND confirmed_by_name IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Pickup_Method",
                table: "pickups",
                sql: "pickup_method IN ('Primary', 'Backup', 'PhoneConfirmed')");

            migrationBuilder.AddForeignKey(
                name: "fk_registered_pickup_persons_users_consent_confirmed_by_user_id",
                table: "registered_pickup_persons",
                column: "consent_confirmed_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_registered_pickup_persons_users_consent_confirmed_by_user_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropIndex(
                name: "ix_registered_pickup_persons_child_id_priority",
                table: "registered_pickup_persons");

            migrationBuilder.DropIndex(
                name: "ix_registered_pickup_persons_consent_confirmed_by_user_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropCheckConstraint(
                name: "CK_RegisteredPickupPerson_Priority",
                table: "registered_pickup_persons");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Pickup_ConfirmedByName",
                table: "pickups");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Pickup_Method",
                table: "pickups");

            migrationBuilder.DropColumn(
                name: "citizen_id_number",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "consent_confirmed_at",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "consent_confirmed_by_user_id",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "face_photo_reference",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "phone_number",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "priority",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "relationship",
                table: "registered_pickup_persons");

            migrationBuilder.DropColumn(
                name: "confirmed_by_name",
                table: "pickups");

            migrationBuilder.DropColumn(
                name: "picker_full_name",
                table: "pickups");

            migrationBuilder.DropColumn(
                name: "pickup_method",
                table: "pickups");

            migrationBuilder.AlterColumn<string>(
                name: "full_name",
                table: "registered_pickup_persons",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<Guid>(
                name: "pickup_person_id",
                table: "pickups",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_registered_pickup_persons_child_id",
                table: "registered_pickup_persons",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_pickups_pickup_person_id",
                table: "pickups",
                column: "pickup_person_id");

            migrationBuilder.AddForeignKey(
                name: "fk_pickups_registered_pickup_persons_pickup_person_id",
                table: "pickups",
                column: "pickup_person_id",
                principalTable: "registered_pickup_persons",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
