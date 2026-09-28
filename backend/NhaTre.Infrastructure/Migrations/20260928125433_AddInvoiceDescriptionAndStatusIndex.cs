using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceDescriptionAndStatusIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Không đặt DEFAULT '' như EF sinh sẵn: mô tả là bắt buộc (D39 mục 4), giá trị mặc
            // rỗng sẽ cho phép ghi hóa đơn không có mô tả. Bảng invoices đang trống nên thêm
            // cột NOT NULL không cần giá trị mặc định; nếu có dòng, lệnh lỗi và không đổi gì.
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "invoices",
                type: "text",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_status",
                table: "invoices",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_invoices_status",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "description",
                table: "invoices");
        }
    }
}
