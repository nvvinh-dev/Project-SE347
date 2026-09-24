using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChildHealthNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "health_notes",
                table: "children",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "health_notes",
                table: "children");
        }
    }
}
