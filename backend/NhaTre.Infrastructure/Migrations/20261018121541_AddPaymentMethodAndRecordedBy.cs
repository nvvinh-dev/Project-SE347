using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodAndRecordedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "external_reference",
                table: "payments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Không đặt DEFAULT '' và Guid rỗng như EF sinh sẵn: hình thức và người ghi nhận là bắt
            // buộc (D21), giá trị mặc định sẽ cho phép ghi thanh toán thiếu hai giá trị này. Chưa có
            // chức năng nào ghi payments nên bảng đang trống, thêm cột NOT NULL không cần giá trị mặc
            // định; nếu có dòng, lệnh lỗi và không đổi gì.
            migrationBuilder.AddColumn<string>(
                name: "payment_method",
                table: "payments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false);

            migrationBuilder.AddColumn<Guid>(
                name: "recorded_by_user_id",
                table: "payments",
                type: "uuid",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "ix_payments_recorded_by_user_id",
                table: "payments",
                column: "recorded_by_user_id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Payment_Method",
                table: "payments",
                sql: "payment_method IN ('Cash', 'BankTransfer')");

            migrationBuilder.AddForeignKey(
                name: "fk_payments_users_recorded_by_user_id",
                table: "payments",
                column: "recorded_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_payments_users_recorded_by_user_id",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "ix_payments_recorded_by_user_id",
                table: "payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Payment_Method",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "payment_method",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "recorded_by_user_id",
                table: "payments");

            migrationBuilder.AlterColumn<string>(
                name: "external_reference",
                table: "payments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);
        }
    }
}
