using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NhaTre.Domain.Constants;

#nullable disable

namespace NhaTre.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBankTransactionsAndPaymentCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ---- 1. invoices.payment_code (D21 mục 1) ----
            // Không dùng DEFAULT '' như EF sinh sẵn: '' không qua được CHECK định dạng và mọi hóa đơn
            // sẽ trùng nhau. Thêm cột cho phép rỗng, sinh mã cho hóa đơn đã có, rồi mới đặt NOT NULL.
            migrationBuilder.AddColumn<string>(
                name: "payment_code",
                table: "invoices",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            // Mã của hóa đơn đã có dựng từ cùng PaymentCodes với lúc tạo hóa đơn. Gặp mã đã có thì sinh
            // lại, nên UNIQUE đặt ngay sau đây không lỗi. random() đủ dùng cho số ít hóa đơn cũ: biết
            // trước mã chỉ cho phép trả tiền hộ hóa đơn đó, không lộ dữ liệu nào.
            migrationBuilder.Sql($$"""
                DO $$
                DECLARE
                    r record;
                    code text;
                BEGIN
                    FOR r IN SELECT id FROM invoices WHERE payment_code IS NULL LOOP
                        LOOP
                            SELECT '{{PaymentCodes.Prefix}}' || string_agg(
                                       substr('{{PaymentCodes.Alphabet}}', 1 + floor(random() * {{PaymentCodes.Alphabet.Length}})::int, 1), '')
                              INTO code
                              FROM generate_series(1, {{PaymentCodes.RandomLength}});
                            EXIT WHEN NOT EXISTS (SELECT 1 FROM invoices WHERE payment_code = code);
                        END LOOP;
                        UPDATE invoices SET payment_code = code WHERE id = r.id;
                    END LOOP;
                END $$;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "payment_code",
                table: "invoices",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_payment_code",
                table: "invoices",
                column: "payment_code",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Invoice_PaymentCode",
                table: "invoices",
                sql: "payment_code ~ '^HP[A-HJ-NP-Z2-9]{8}$'");

            // ---- 2. bank_transactions (D21 mục 2, 3) ----
            migrationBuilder.CreateTable(
                name: "bank_transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    transaction_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    account_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    content = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    transaction_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    unmatched_reason = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolution_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    resolved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bank_transactions", x => x.id);
                    table.CheckConstraint("CK_BankTransaction_AmountPositive", "amount > 0");
                    table.CheckConstraint("CK_BankTransaction_DismissedHasResolution", "status <> 'Dismissed' OR (resolution_note IS NOT NULL AND resolved_by_user_id IS NOT NULL)");
                    table.CheckConstraint("CK_BankTransaction_MatchedHasInvoice", "(status = 'Matched') = (invoice_id IS NOT NULL)");
                    table.CheckConstraint("CK_BankTransaction_Status", "status IN ('Matched', 'Unmatched', 'Dismissed')");
                    table.CheckConstraint("CK_BankTransaction_UnmatchedHasReason", "status <> 'Unmatched' OR unmatched_reason IS NOT NULL");
                    table.CheckConstraint("CK_BankTransaction_UnmatchedReason", "unmatched_reason IS NULL OR unmatched_reason IN ('NoInvoiceCode', 'AmbiguousInvoiceCode', 'AmountMismatch', 'InvoiceAlreadyPaid')");
                    table.ForeignKey(
                        name: "fk_bank_transactions_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_bank_transactions_users_resolved_by_user_id",
                        column: x => x.resolved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bank_transactions_invoice_id",
                table: "bank_transactions",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "ix_bank_transactions_resolved_by_user_id",
                table: "bank_transactions",
                column: "resolved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_bank_transactions_status",
                table: "bank_transactions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_bank_transactions_transaction_id",
                table: "bank_transactions",
                column: "transaction_id",
                unique: true);

            // Bảng mới bật RLS ngay, không thêm policy, như các bảng khác: chỉ backend đọc ghi được
            migrationBuilder.Sql("ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;");

            // ---- 3. payments (D21, D51) ----
            // Chỉ bỏ NOT NULL, không đổi dữ liệu: mọi dòng hiện có đều do Kế toán ghi nhận
            migrationBuilder.AlterColumn<Guid>(
                name: "recorded_by_user_id",
                table: "payments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "bank_transaction_id",
                table: "payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_payments_bank_transaction_id",
                table: "payments",
                column: "bank_transaction_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_payments_bank_transactions_bank_transaction_id",
                table: "payments",
                column: "bank_transaction_id",
                principalTable: "bank_transactions",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Payment_RecordedOrBankTransaction",
                table: "payments",
                sql: "recorded_by_user_id IS NOT NULL OR bank_transaction_id IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Payment_BankTransactionIsTransfer",
                table: "payments",
                sql: "bank_transaction_id IS NULL OR payment_method = 'BankTransfer'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Payment_BankTransactionIsTransfer",
                table: "payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Payment_RecordedOrBankTransaction",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "fk_payments_bank_transactions_bank_transaction_id",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "ix_payments_bank_transaction_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "bank_transaction_id",
                table: "payments");

            // Không đặt DEFAULT Guid rỗng như EF sinh sẵn. Đã có khoản tự đối soát (người ghi nhận rỗng)
            // thì lệnh lỗi và không đổi gì, không gán bừa một người ghi nhận.
            migrationBuilder.AlterColumn<Guid>(
                name: "recorded_by_user_id",
                table: "payments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "bank_transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Invoice_PaymentCode",
                table: "invoices");

            migrationBuilder.DropIndex(
                name: "ix_invoices_payment_code",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "payment_code",
                table: "invoices");
        }
    }
}
