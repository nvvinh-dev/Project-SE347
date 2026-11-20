using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAllergensAndAbsenceFollowUps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "menu_entries",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.CreateTable(
                name: "absence_follow_ups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    attendance_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recorded_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    outcome = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_absence_follow_ups", x => x.id);
                    table.CheckConstraint("CK_AbsenceFollowUp_Outcome", "outcome IN ('Reached', 'Unreachable')");
                    table.CheckConstraint("CK_AbsenceFollowUp_ReachedNote", "outcome <> 'Reached' OR note IS NOT NULL");
                    table.ForeignKey(
                        name: "fk_absence_follow_ups_attendances_attendance_id",
                        column: x => x.attendance_id,
                        principalTable: "attendances",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_absence_follow_ups_teachers_recorded_by_teacher_id",
                        column: x => x.recorded_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "allergens",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    sort_order = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_allergens", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "allergy_acknowledgements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    acknowledged_by_teacher_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ack_date = table.Column<DateOnly>(type: "date", nullable: false),
                    allergen_codes = table.Column<string[]>(type: "text[]", nullable: false),
                    acknowledged_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_allergy_acknowledgements", x => x.id);
                    table.ForeignKey(
                        name: "fk_allergy_acknowledgements_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_allergy_acknowledgements_teachers_acknowledged_by_teacher_id",
                        column: x => x.acknowledged_by_teacher_id,
                        principalTable: "teachers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "child_allergens",
                columns: table => new
                {
                    child_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allergen_id = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_child_allergens", x => new { x.child_id, x.allergen_id });
                    table.ForeignKey(
                        name: "fk_child_allergens_allergens_allergen_id",
                        column: x => x.allergen_id,
                        principalTable: "allergens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_child_allergens_children_child_id",
                        column: x => x.child_id,
                        principalTable: "children",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "menu_entry_allergens",
                columns: table => new
                {
                    menu_entry_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allergen_id = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_menu_entry_allergens", x => new { x.menu_entry_id, x.allergen_id });
                    table.ForeignKey(
                        name: "fk_menu_entry_allergens_allergens_allergen_id",
                        column: x => x.allergen_id,
                        principalTable: "allergens",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_menu_entry_allergens_menu_entries_menu_entry_id",
                        column: x => x.menu_entry_id,
                        principalTable: "menu_entries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "allergens",
                columns: new[] { "id", "code", "name", "sort_order" },
                values: new object[,]
                {
                    { (short)1, "Milk", "Sữa bò và sản phẩm từ sữa", (short)1 },
                    { (short)2, "Egg", "Trứng", (short)2 },
                    { (short)3, "Peanut", "Đậu phộng", (short)3 },
                    { (short)4, "TreeNut", "Hạt cây (điều, óc chó, hạnh nhân...)", (short)4 },
                    { (short)5, "Soy", "Đậu nành", (short)5 },
                    { (short)6, "Wheat", "Lúa mì, gluten", (short)6 },
                    { (short)7, "Fish", "Cá", (short)7 },
                    { (short)8, "Crustacean", "Giáp xác (tôm, cua)", (short)8 },
                    { (short)9, "Mollusc", "Nhuyễn thể (mực, nghêu, sò)", (short)9 },
                    { (short)10, "Sesame", "Mè", (short)10 }
                });

            migrationBuilder.CreateIndex(
                name: "ix_absence_follow_ups_attendance_id",
                table: "absence_follow_ups",
                column: "attendance_id");

            migrationBuilder.CreateIndex(
                name: "ix_absence_follow_ups_recorded_by_teacher_id",
                table: "absence_follow_ups",
                column: "recorded_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_allergens_code",
                table: "allergens",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_allergy_acknowledgements_acknowledged_by_teacher_id",
                table: "allergy_acknowledgements",
                column: "acknowledged_by_teacher_id");

            migrationBuilder.CreateIndex(
                name: "ix_allergy_acknowledgements_child_id_ack_date",
                table: "allergy_acknowledgements",
                columns: new[] { "child_id", "ack_date" });

            migrationBuilder.CreateIndex(
                name: "ix_child_allergens_allergen_id",
                table: "child_allergens",
                column: "allergen_id");

            migrationBuilder.CreateIndex(
                name: "ix_menu_entry_allergens_allergen_id",
                table: "menu_entry_allergens",
                column: "allergen_id");

            // Bảng mới bật RLS ngay, không thêm policy, như các bảng khác: chỉ backend đọc ghi được
            migrationBuilder.Sql("ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE child_allergens ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE menu_entry_allergens ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE allergy_acknowledgements ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE absence_follow_ups ENABLE ROW LEVEL SECURITY;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "absence_follow_ups");

            migrationBuilder.DropTable(
                name: "allergy_acknowledgements");

            migrationBuilder.DropTable(
                name: "child_allergens");

            migrationBuilder.DropTable(
                name: "menu_entry_allergens");

            migrationBuilder.DropTable(
                name: "allergens");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "menu_entries");
        }
    }
}
