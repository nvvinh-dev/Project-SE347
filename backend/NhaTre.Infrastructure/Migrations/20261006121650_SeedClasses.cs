using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedClasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "classes",
                columns: new[] { "id", "homeroom_teacher_id", "max_age_months", "min_age_months", "name" },
                values: new object[,]
                {
                    { new Guid("e84b9f79-dc69-4aa2-b569-3558337df117"), null, 48, 36, "Lớp Mầm" },
                    { new Guid("f8600076-d709-46e9-b658-2b2b1143509d"), null, 60, 48, "Lớp Chồi" },
                    { new Guid("f983817a-6f20-400a-b631-b94f1497820f"), null, 72, 60, "Lớp Lá" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("e84b9f79-dc69-4aa2-b569-3558337df117"));

            migrationBuilder.DeleteData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f8600076-d709-46e9-b658-2b2b1143509d"));

            migrationBuilder.DeleteData(
                table: "classes",
                keyColumn: "id",
                keyValue: new Guid("f983817a-6f20-400a-b631-b94f1497820f"));
        }
    }
}
