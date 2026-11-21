using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class TuitionRepository : ITuitionRepository
{
    private readonly AppDbContext _dbContext;

    public TuitionRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TuitionFee>> GetAllFeesAsync()
    {
        return await _dbContext.TuitionFees.ToListAsync();
    }

    public async Task<TuitionFee?> FindFeeByIdAsync(Guid id)
    {
        return await _dbContext.TuitionFees
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<bool> AnyFeeAsync()
    {
        return await _dbContext.TuitionFees.AnyAsync();
    }

    public void AddFee(TuitionFee fee)
    {
        _dbContext.TuitionFees.Add(fee);
    }

    // Mới lập xếp trước; bỏ trống bộ lọc nào thì không lọc theo tiêu chí đó
    public async Task<IReadOnlyList<Invoice>> GetInvoicesAsync(Guid? childId, string? status)
    {
        var query = _dbContext.Invoices.Include(i => i.Child).AsQueryable();

        if (childId is not null)
            query = query.Where(i => i.ChildId == childId);

        if (status is not null)
            query = query.Where(i => i.Status == status);

        return await query
            .OrderByDescending(i => i.IssuedAt)
            .ThenBy(i => i.Id)
            .ToListAsync();
    }

    // Không theo dõi thay đổi: sửa hóa đơn đi qua UpdateUnpaidInvoiceAsync, nên một SaveChanges khác
    // trong cùng request (ví dụ lúc ghi thông báo) không thể ghi đè hóa đơn mà bỏ qua điều kiện status
    public async Task<Invoice?> FindInvoiceByIdAsync(Guid id)
    {
        return await _dbContext.Invoices
            .AsNoTracking()
            .Include(i => i.Child)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public void AddInvoice(Invoice invoice)
    {
        _dbContext.Invoices.Add(invoice);
    }

    // Liên kết phụ huynh–trẻ luôn có trong câu truy vấn (BR-TUITION-04), không chỉ kiểm ở Service.
    // Mới lập xếp trước; id để thứ tự cố định khi hai hóa đơn lập cùng thời điểm
    public async Task<IReadOnlyList<Invoice>> GetInvoicesOfChildForGuardianAsync(Guid childId, Guid parentUserId)
    {
        return await _dbContext.Invoices
            .AsNoTracking()
            .Where(i => i.ChildId == childId
                && i.Child.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId))
            .OrderByDescending(i => i.IssuedAt)
            .ThenBy(i => i.Id)
            .ToListAsync();
    }

    public async Task<Invoice?> FindInvoiceOfChildForGuardianAsync(Guid childId, Guid invoiceId, Guid parentUserId)
    {
        return await _dbContext.Invoices
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == invoiceId
                && i.ChildId == childId
                && i.Child.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId));
    }

    // BR-TUITION-12: điều kiện status = 'unpaid' nằm ngay trong câu UPDATE. Hóa đơn được ghi nhận
    // thanh toán giữa lúc Service đọc và lúc lưu thì không dòng nào khớp, số tiền cũ được giữ nguyên.
    public async Task<bool> UpdateUnpaidInvoiceAsync(Guid id, Guid childId, decimal amount, string description)
    {
        var updatedRows = await _dbContext.Invoices
            .Where(i => i.Id == id && i.Status == InvoiceStatuses.Unpaid)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(i => i.ChildId, childId)
                .SetProperty(i => i.Amount, amount)
                .SetProperty(i => i.Description, description));

        return updatedRows == 1;
    }

    // BR-TUITION-10, D44 mục 4: điều kiện status = 'unpaid' nằm ngay trong câu UPDATE, và câu UPDATE giữ
    // khóa dòng hóa đơn tới lúc commit. Request thứ hai cho cùng hóa đơn phải chờ request đầu commit, rồi
    // thấy hóa đơn đã paid nên không dòng nào khớp: chỉ một bản ghi thanh toán được tạo.
    // Số tiền lấy bằng RETURNING của chính câu đó, không từ lần đọc trước: hóa đơn unpaid có thể vừa được
    // sửa số tiền, mà khoản đã thu phải bằng số tiền của hóa đơn đã paid (BR-TUITION-12)
    public async Task<Payment?> RecordPaymentAsync(Guid invoiceId, string paymentMethod, string? externalReference,
        Guid recordedByUserId, DateTime paidAtUtc)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        // ExecuteUpdate của EF Core không trả được cột nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi
        var amounts = await _dbContext.Database
            .SqlQuery<decimal>($"UPDATE invoices SET status = {InvoiceStatuses.Paid} WHERE id = {invoiceId} AND status = {InvoiceStatuses.Unpaid} RETURNING amount AS \"Value\"")
            .ToListAsync();

        // Không dòng nào khớp thì thoát mà không commit: transaction tự rollback
        if (amounts.Count == 0)
            return null;

        var payment = new Payment
        {
            InvoiceId = invoiceId,
            Amount = amounts[0],
            PaidAt = paidAtUtc,
            PaymentMethod = paymentMethod,
            ExternalReference = externalReference,
            RecordedByUserId = recordedByUserId
        };

        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();

        await transaction.CommitAsync();
        return payment;
    }

    public async Task<bool> InvoiceExistsAsync(Guid id)
    {
        return await _dbContext.Invoices.AnyAsync(i => i.Id == id);
    }

    public async Task<bool> BankTransactionExistsAsync(string transactionId)
    {
        return await _dbContext.BankTransactions.AnyAsync(b => b.TransactionId == transactionId);
    }

    // D21 mục 2, bước 5: lưu giao dịch và đối soát trong cùng một transaction. Gạch nợ dùng cùng cách khóa
    // của RecordPaymentAsync, thêm điều kiện amount = số tiền giao dịch: không gạch nợ một phần. Hai webhook
    // cùng một giao dịch gửi đồng thời thì lần sau chờ khóa dòng hóa đơn (hoặc khóa của unique
    // transaction_id) tới khi lần đầu commit, rồi vấp unique transaction_id: rollback cả câu UPDATE hóa đơn
    // của lần đó và trả null như gửi lại. paid_at là lúc tiền vào tài khoản, không phải lúc đối soát
    public async Task<BankTransaction?> ReconcileBankTransactionAsync(
        BankTransaction transaction, IReadOnlyCollection<string> paymentCodes)
    {
        await using var dbTransaction = await _dbContext.Database.BeginTransactionAsync();

        var invoiceIds = paymentCodes.Count == 0
            ? new List<Guid>()
            : await _dbContext.Invoices
                .Where(i => paymentCodes.Contains(i.PaymentCode))
                .Select(i => i.Id)
                .ToListAsync();

        Payment? payment = null;

        if (invoiceIds.Count == 0)
        {
            MarkUnmatched(transaction, UnmatchedReasons.NoInvoiceCode);
        }
        else if (invoiceIds.Count > 1)
        {
            MarkUnmatched(transaction, UnmatchedReasons.AmbiguousInvoiceCode);
        }
        else
        {
            var invoiceId = invoiceIds[0];
            var amounts = await _dbContext.Database
                .SqlQuery<decimal>($"UPDATE invoices SET status = {InvoiceStatuses.Paid} WHERE id = {invoiceId} AND status = {InvoiceStatuses.Unpaid} AND amount = {transaction.Amount} RETURNING amount AS \"Value\"")
                .ToListAsync();

            if (amounts.Count == 1)
            {
                transaction.Status = BankTransactionStatuses.Matched;
                transaction.InvoiceId = invoiceId;
                payment = new Payment
                {
                    InvoiceId = invoiceId,
                    Amount = amounts[0],
                    PaidAt = transaction.TransactionAt,
                    PaymentMethod = PaymentMethods.BankTransfer,
                    ExternalReference = transaction.TransactionId,
                    RecordedByUserId = null,
                    BankTransaction = transaction
                };
            }
            else
            {
                // Không có thao tác xóa hóa đơn nên hóa đơn vẫn còn: không khớp vì đã paid hoặc vì lệch số tiền
                var status = await _dbContext.Invoices
                    .Where(i => i.Id == invoiceId)
                    .Select(i => i.Status)
                    .FirstAsync();
                MarkUnmatched(transaction, status == InvoiceStatuses.Paid
                    ? UnmatchedReasons.InvoiceAlreadyPaid
                    : UnmatchedReasons.AmountMismatch);
            }
        }

        _dbContext.BankTransactions.Add(transaction);
        if (payment is not null)
            _dbContext.Payments.Add(payment);

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: "ix_bank_transactions_transaction_id"
        })
        {
            // Bỏ theo dõi để một SaveChanges khác trong cùng request không thử ghi lại; transaction chưa commit
            // nên tự rollback khi thoát hàm
            if (payment is not null)
                _dbContext.Entry(payment).State = EntityState.Detached;
            _dbContext.Entry(transaction).State = EntityState.Detached;
            return null;
        }

        await dbTransaction.CommitAsync();
        return transaction;
    }

    private static void MarkUnmatched(BankTransaction transaction, string reason)
    {
        transaction.Status = BankTransactionStatuses.Unmatched;
        transaction.UnmatchedReason = reason;
    }

    // SUM của tháng chưa có thanh toán nào ra 0, không phải null (EF dịch thành COALESCE(SUM(...), 0))
    public async Task<decimal> SumPaymentsAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await _dbContext.Payments
            .Where(p => p.PaidAt >= fromUtc && p.PaidAt < toUtc)
            .SumAsync(p => p.Amount);
    }

    public async Task<int> CountUnpaidInvoicesAsync()
    {
        return await _dbContext.Invoices
            .CountAsync(i => i.Status == InvoiceStatuses.Unpaid);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
