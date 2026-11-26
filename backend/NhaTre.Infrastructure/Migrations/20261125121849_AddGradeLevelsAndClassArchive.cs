using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGradeLevelsAndClassArchive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ---- 1. grade_levels: 3 khối cố định (D39 mục 3) ----
            migrationBuilder.CreateTable(
                name: "grade_levels",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    min_age_months = table.Column<int>(type: "integer", nullable: false),
                    max_age_months = table.Column<int>(type: "integer", nullable: false),
                    sort_order = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grade_levels", x => x.id);
                    table.CheckConstraint("CK_GradeLevel_AgeRange", "min_age_months < max_age_months");
                });

            migrationBuilder.InsertData(
                table: "grade_levels",
                columns: new[] { "id", "max_age_months", "min_age_months", "name", "sort_order" },
                values: new object[,]
                {
                    { (short)1, 48, 36, "Mầm", (short)1 },
                    { (short)2, 60, 48, "Chồi", (short)2 },
                    { (short)3, 72, 60, "Lá", (short)3 }
                });

            migrationBuilder.CreateIndex(
                name: "ix_grade_levels_name",
                table: "grade_levels",
                column: "name",
                unique: true);

            // Bảng mới bật RLS ngay, không thêm policy, như các bảng khác: chỉ backend đọc ghi được
            migrationBuilder.Sql("ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;");

            // ---- 2. classes: khối, sĩ số, lưu trữ (D39 mục 3) ----
            migrationBuilder.AddColumn<DateTime>(
                name: "archived_at_utc",
                table: "classes",
                type: "timestamp with time zone",
                nullable: true);

            // Không dùng DEFAULT 0 như EF sinh sẵn: 0 không phải khối nào, và cột sẽ giữ DEFAULT đó
            // mãi trong khi model không có. Thêm cột cho phép rỗng, gán khối cho 3 lớp có sẵn, rồi mới
            // đặt NOT NULL. Nếu DB có lớp nào ngoài 3 lớp seed thì bước NOT NULL lỗi và cả migration
            // rollback, không để lại lớp không có khối.
            migrationBuilder.AddColumn<short>(
                name: "grade_level_id",
                table: "classes",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "max_capacity",
                table: "classes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "min_capacity",
                table: "classes",
                type: "integer",
                nullable: true);

            // Ba lớp có sẵn giữ id, vào ba khối tương ứng và đổi tên thành Mầm 1, Chồi 1, Lá 1
            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("e84b9f79-dc69-4aa2-b569-3558337df117"),
                columns: new[] { "archived_at_utc", "grade_level_id", "max_capacity", "min_capacity", "name" },
                values: new object[] { null, (short)1, null, null, "Mầm 1" });

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f8600076-d709-46e9-b658-2b2b1143509d"),
                columns: new[] { "archived_at_utc", "grade_level_id", "max_capacity", "min_capacity", "name" },
                values: new object[] { null, (short)2, null, null, "Chồi 1" });

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f983817a-6f20-400a-b631-b94f1497820f"),
                columns: new[] { "archived_at_utc", "grade_level_id", "max_capacity", "min_capacity", "name" },
                values: new object[] { null, (short)3, null, null, "Lá 1" });

            migrationBuilder.AlterColumn<short>(
                name: "grade_level_id",
                table: "classes",
                type: "smallint",
                nullable: false,
                oldClrType: typeof(short),
                oldType: "smallint",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_classes_grade_level_id",
                table: "classes",
                column: "grade_level_id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Class_CapacityRange",
                table: "classes",
                sql: "min_capacity IS NULL OR max_capacity IS NULL OR min_capacity <= max_capacity");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Class_MaxCapacity",
                table: "classes",
                sql: "max_capacity IS NULL OR max_capacity >= 1");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Class_MinCapacity",
                table: "classes",
                sql: "min_capacity IS NULL OR min_capacity >= 1");

            migrationBuilder.AddForeignKey(
                name: "fk_classes_grade_levels_grade_level_id",
                table: "classes",
                column: "grade_level_id",
                principalTable: "grade_levels",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_classes_grade_levels_grade_level_id",
                table: "classes");

            migrationBuilder.DropTable(
                name: "grade_levels");

            migrationBuilder.DropIndex(
                name: "ix_classes_grade_level_id",
                table: "classes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Class_CapacityRange",
                table: "classes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Class_MaxCapacity",
                table: "classes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Class_MinCapacity",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "archived_at_utc",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "grade_level_id",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "max_capacity",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "min_capacity",
                table: "classes");

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("e84b9f79-dc69-4aa2-b569-3558337df117"),
                column: "name",
                value: "Lớp Mầm");

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f8600076-d709-46e9-b658-2b2b1143509d"),
                column: "name",
                value: "Lớp Chồi");

            migrationBuilder.UpdateData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f983817a-6f20-400a-b631-b94f1497820f"),
                column: "name",
                value: "Lớp Lá");
        }
    }
}
