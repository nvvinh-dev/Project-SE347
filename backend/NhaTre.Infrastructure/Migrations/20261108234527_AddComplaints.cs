using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddComplaints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "complaints",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submitted_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    handled_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    resolution = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_complaints", x => x.id);
                    table.CheckConstraint("CK_Complaint_Resolution", "status <> 'Resolved' OR (resolution IS NOT NULL AND resolution <> '')");
                    table.CheckConstraint("CK_Complaint_Status", "status IN ('New', 'InProgress', 'Resolved')");
                    table.ForeignKey(
                        name: "fk_complaints_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_complaints_users_handled_by_user_id",
                        column: x => x.handled_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_complaints_users_submitted_by_user_id",
                        column: x => x.submitted_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_complaints_child_id",
                table: "complaints",
                column: "child_id");

            migrationBuilder.CreateIndex(
                name: "ix_complaints_handled_by_user_id",
                table: "complaints",
                column: "handled_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_complaints_status",
                table: "complaints",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_complaints_submitted_by_user_id",
                table: "complaints",
                column: "submitted_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "complaints");
        }
    }
}
