using System.Globalization;
using System.Text.RegularExpressions;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class TuitionService : ITuitionService
{
    // Số tiền trong thông báo viết kiểu Việt Nam (1.500.000), không phụ thuộc culture của máy chủ
    private static readonly NumberFormatInfo VietnameseNumberFormat = new()
    {
        NumberGroupSeparator = ".",
        NumberDecimalSeparator = ","
    };

    // Dạng mã thanh toán dựng từ chính PaymentCodes. Lookahead để các lần khớp được chồng lên nhau
    private static readonly Regex PaymentCodeCandidate = new(
        $"(?=({PaymentCodes.Prefix}[{PaymentCodes.Alphabet}]{{{PaymentCodes.RandomLength}}}))",
        RegexOptions.CultureInvariant);

    private readonly ITuitionRepository _tuitionRepository;
    private readonly IChildRepository _childRepository;
    private readonly IChildGuardianRepository _childGuardianRepository;
    private readonly INotificationService _notificationService;
    private readonly ISecurityEventService _securityEventService;
    private readonly PaymentAccountSettings _paymentAccount;

    public TuitionService(
        ITuitionRepository tuitionRepository,
        IChildRepository childRepository,
        IChildGuardianRepository childGuardianRepository,
        INotificationService notificationService,
        ISecurityEventService securityEventService,
        PaymentAccountSettings paymentAccount)
    {
        _tuitionRepository = tuitionRepository;
        _childRepository = childRepository;
        _childGuardianRepository = childGuardianRepository;
        _notificationService = notificationService;
        _securityEventService = securityEventService;
        _paymentAccount = paymentAccount;
    }

    public async Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync()
    {
        var fees = await _tuitionRepository.GetAllFeesAsync();
        return fees.Select(ToResponse).ToList();
    }

    public async Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);
        return fee is null ? null : ToResponse(fee);
    }

    // D39 mục 4: một mức phí chung toàn trường. Đã có biểu phí thì trả null để Controller
    // báo 409 — Kế toán sửa mức phí hiện có chứ không tạo thêm
    public async Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request)
    {
        if (await _tuitionRepository.AnyFeeAsync())
            return null;

        var fee = new TuitionFee
        {
            Description = request.Description.Trim(),
            Amount = request.Amount
        };

        _tuitionRepository.AddFee(fee);
        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    // Hóa đơn chép số tiền và mô tả lúc tạo, nên sửa biểu phí không làm đổi hóa đơn đã lập (D39 mục 4)
    public async Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);

        if (fee is null)
            return null;

        fee.Description = request.Description.Trim();
        fee.Amount = request.Amount;

        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    public async Task<IReadOnlyList<InvoiceResponse>> GetInvoicesAsync(Guid? childId, string? status)
    {
        var invoices = await _tuitionRepository.GetInvoicesAsync(childId, status);
        return invoices.Select(ToResponse).ToList();
    }

    public async Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id)
    {
        var invoice = await _tuitionRepository.FindInvoiceByIdAsync(id);
        return invoice is null ? null : ToResponse(invoice);
    }

    // Hóa đơn chỉ lập được khi đã có biểu phí (UC-TUITION-02) và luôn gắn với biểu phí đó.
    // Trạng thái và thời điểm lập do server đặt (BR-TUITION-09, D44 mục 2)
    public async Task<InvoiceResult> CreateInvoiceAsync(InvoiceRequest request)
    {
        var child = await _childRepository.FindByIdAsync(request.ChildId);
        if (child is null)
            return new InvoiceResult(InvoiceOutcome.ChildNotFound);

        var fee = (await _tuitionRepository.GetAllFeesAsync()).FirstOrDefault();
        if (fee is null)
            return new InvoiceResult(InvoiceOutcome.TuitionFeeMissing);

        var invoice = new Invoice
        {
            ChildId = child.Id,
            Child = child,
            TuitionFeeId = fee.Id,
            Amount = request.Amount,
            Description = request.Description.Trim(),
            IssuedAt = DateTime.UtcNow,
            Status = InvoiceStatuses.Unpaid,
            // D21 mục 1: server sinh, không đổi khi sửa. Không thử lại khi trùng: không gian mã 32^8,
            // UNIQUE ở DB vẫn chặn nếu trùng thật
            PaymentCode = PaymentCodes.Generate()
        };

        _tuitionRepository.AddInvoice(invoice);
        await _tuitionRepository.SaveChangesAsync();

        // D39 mục 6: hóa đơn mới gửi phụ huynh của đúng trẻ, sau khi hóa đơn đã lưu
        await _notificationService.NotifyParentsOfChildAsync(child.Id,
            NewInvoiceMessage(child.FullName, invoice.Description, invoice.Amount));

        return new InvoiceResult(InvoiceOutcome.Success, ToResponse(invoice));
    }

    // FR-TUITION-10: xem trước không ghi gì. Phạm vi không còn trẻ nào để lập vẫn trả kết quả (số 0 kèm danh
    // sách bị bỏ qua) để Kế toán thấy lý do; chỉ lệnh lập mới báo 409
    public async Task<BulkInvoicePreviewResult> PreviewBulkInvoicesAsync(BulkInvoiceRequest request)
    {
        var (outcome, candidates) = await FindBulkInvoiceCandidatesAsync(request, request.Description.Trim());
        if (outcome != BulkInvoiceOutcome.Success)
            return new BulkInvoicePreviewResult(outcome);

        return new BulkInvoicePreviewResult(BulkInvoiceOutcome.Success, new BulkInvoicePreviewResponse(
            candidates.Count(c => !c.AlreadyInvoiced),
            candidates.Where(c => c.AlreadyInvoiced).Select(ToSkippedChild).ToList()));
    }

    // FR-TUITION-10, D39 mục 21: mỗi hóa đơn theo đúng quy tắc của hóa đơn lập từng trẻ (unpaid, thời điểm
    // lập và mã thanh toán do server đặt). Repository kiểm lại trùng mô tả trong transaction, nên trẻ bị bỏ
    // qua tính theo các hóa đơn thật sự đã lưu, không theo lần đọc trước. Không ghi security_events (D50)
    public async Task<BulkInvoiceResult> CreateBulkInvoicesAsync(BulkInvoiceRequest request)
    {
        var description = request.Description.Trim();
        var (outcome, candidates) = await FindBulkInvoiceCandidatesAsync(request, description);
        if (outcome != BulkInvoiceOutcome.Success)
            return new BulkInvoiceResult(outcome);

        var issuedAtUtc = DateTime.UtcNow;
        // Mã trùng nhau trong cùng lô thì sinh lại, để một mã trùng không làm hỏng cả lô; trùng với hóa đơn
        // đã có thì UNIQUE ở DB chặn như hóa đơn lập từng trẻ
        var paymentCodes = new HashSet<string>();
        var invoices = candidates
            .Where(c => !c.AlreadyInvoiced)
            .Select(c =>
            {
                string paymentCode;
                do paymentCode = PaymentCodes.Generate();
                while (!paymentCodes.Add(paymentCode));

                return new Invoice
                {
                    ChildId = c.ChildId,
                    TuitionFeeId = request.TuitionFeeId,
                    Amount = request.Amount,
                    Description = description,
                    IssuedAt = issuedAtUtc,
                    Status = InvoiceStatuses.Unpaid,
                    PaymentCode = paymentCode
                };
            })
            .ToList();

        if (invoices.Count == 0)
            return new BulkInvoiceResult(BulkInvoiceOutcome.NothingToCreate);

        var saved = await _tuitionRepository.AddBulkInvoicesAsync(request.TuitionFeeId, invoices, description);
        if (saved.Count == 0)
            return new BulkInvoiceResult(BulkInvoiceOutcome.NothingToCreate);

        // D39 mục 6, 21: mỗi hóa đơn một thông báo cho phụ huynh của đúng trẻ, sau khi cả lô đã commit
        var fullNames = candidates.ToDictionary(c => c.ChildId, c => c.ChildFullName);
        foreach (var invoice in saved)
            await _notificationService.NotifyParentsOfChildAsync(invoice.ChildId,
                NewInvoiceMessage(fullNames[invoice.ChildId], description, invoice.Amount));

        var savedChildIds = saved.Select(i => i.ChildId).ToHashSet();
        return new BulkInvoiceResult(BulkInvoiceOutcome.Success, new BulkInvoiceResponse(
            saved.Count,
            candidates.Where(c => !savedChildIds.Contains(c.ChildId)).Select(ToSkippedChild).ToList()));
    }

    // Biểu phí, lớp, khối không tồn tại → 404 (FR-TUITION-10). Validator đã kiểm Scope.Id đúng dạng theo Type
    private async Task<(BulkInvoiceOutcome Outcome, IReadOnlyList<BulkInvoiceCandidate> Candidates)>
        FindBulkInvoiceCandidatesAsync(BulkInvoiceRequest request, string description)
    {
        if (await _tuitionRepository.FindFeeByIdAsync(request.TuitionFeeId) is null)
            return (BulkInvoiceOutcome.TuitionFeeNotFound, Array.Empty<BulkInvoiceCandidate>());

        Guid? classId = null;
        short? gradeLevelId = null;

        if (request.Scope.Type == InvoiceBulkScopeTypes.Class)
        {
            classId = Guid.Parse(request.Scope.Id!);
            if (!await _tuitionRepository.ClassExistsAsync(classId.Value))
                return (BulkInvoiceOutcome.ClassNotFound, Array.Empty<BulkInvoiceCandidate>());
        }
        else if (request.Scope.Type == InvoiceBulkScopeTypes.GradeLevel)
        {
            gradeLevelId = short.Parse(request.Scope.Id!);
            if (!await _tuitionRepository.GradeLevelExistsAsync(gradeLevelId.Value))
                return (BulkInvoiceOutcome.GradeLevelNotFound, Array.Empty<BulkInvoiceCandidate>());
        }

        var candidates = await _tuitionRepository.GetBulkInvoiceCandidatesAsync(classId, gradeLevelId, description);
        return (BulkInvoiceOutcome.Success, candidates);
    }

    // Hiện chỉ có một lý do bỏ qua: trẻ đã có hóa đơn cùng mô tả (BR-TUITION-17)
    private static BulkInvoiceSkippedChild ToSkippedChild(BulkInvoiceCandidate candidate)
        => new(candidate.ChildId, candidate.ChildFullName, InvoiceSkipReasons.DuplicateDescription);

    // Hóa đơn đã paid bị khóa: mọi yêu cầu sửa số tiền, mô tả hay trẻ → 409 (BR-TUITION-12, D44 mục 4).
    // Hóa đơn unpaid sửa được cả trẻ vì không có thao tác xóa, lập nhầm trẻ chỉ sửa được cách này.
    // Lưu bằng UPDATE có điều kiện status = 'unpaid', không sửa hóa đơn đã đọc rồi SaveChanges: người
    // khác có thể ghi nhận thanh toán giữa lúc đọc và lúc lưu, khi đó không dòng nào được cập nhật
    // → 409, không gửi thông báo. `invoice` giữ nguyên giá trị trước khi sửa để soạn thông báo.
    // Thông báo khi sửa theo D39 mục 6, sự kiện 1.
    public async Task<InvoiceResult> UpdateInvoiceAsync(Guid id, InvoiceRequest request)
    {
        var invoice = await _tuitionRepository.FindInvoiceByIdAsync(id);
        if (invoice is null)
            return new InvoiceResult(InvoiceOutcome.InvoiceNotFound);

        if (invoice.Status == InvoiceStatuses.Paid)
            return new InvoiceResult(InvoiceOutcome.InvoicePaid);

        Child? child = invoice.Child;
        if (request.ChildId != invoice.ChildId)
        {
            child = await _childRepository.FindByIdAsync(request.ChildId);
            if (child is null)
                return new InvoiceResult(InvoiceOutcome.ChildNotFound);
        }

        var description = request.Description.Trim();
        var updated = await _tuitionRepository.UpdateUnpaidInvoiceAsync(id, child.Id, request.Amount, description);
        if (!updated)
            return new InvoiceResult(InvoiceOutcome.InvoicePaid);

        if (child.Id != invoice.ChildId)
        {
            await _notificationService.NotifyParentsOfChildAsync(invoice.ChildId,
                $"Hóa đơn của bé {invoice.Child.FullName}: {invoice.Description}, số tiền {FormatAmount(invoice.Amount)} đồng " +
                "đã được Kế toán điều chỉnh sang bé khác. Phụ huynh không cần thanh toán hóa đơn này.");
            await _notificationService.NotifyParentsOfChildAsync(child.Id,
                NewInvoiceMessage(child.FullName, description, request.Amount));
        }
        else if (request.Amount != invoice.Amount || description != invoice.Description)
        {
            await _notificationService.NotifyParentsOfChildAsync(child.Id,
                $"Hóa đơn của bé {child.FullName} đã được cập nhật: {description}, " +
                $"số tiền {FormatAmount(request.Amount)} đồng.");
        }

        return new InvoiceResult(InvoiceOutcome.Success, new InvoiceResponse(invoice.Id, child.Id, child.FullName,
            request.Amount, description, InvoiceStatuses.Unpaid, invoice.IssuedAt, invoice.PaymentCode));
    }

    // FR-TUITION-06, D21: đường duy nhất để hóa đơn sang paid. Số tiền, thời điểm và người ghi nhận do
    // server đặt (BR-TUITION-11). Không chuyển được hóa đơn nào thì mới đọc lại để tách 404 với 409: không
    // có thao tác xóa hóa đơn, nên hóa đơn còn tồn tại thì đã paid. Không sinh thông báo (D39 mục 6)
    public async Task<PaymentResult> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid accountantUserId)
    {
        var externalReference = request.PaymentMethod == PaymentMethods.BankTransfer
            ? request.ExternalReference!.Trim()
            : null;

        var payment = await _tuitionRepository.RecordPaymentAsync(invoiceId, request.PaymentMethod,
            externalReference, accountantUserId, DateTime.UtcNow);

        if (payment is null)
            return new PaymentResult(await _tuitionRepository.InvoiceExistsAsync(invoiceId)
                ? PaymentOutcome.InvoicePaid
                : PaymentOutcome.InvoiceNotFound);

        // D50: ghi sau khi transaction của thanh toán đã commit
        await _securityEventService.RecordAsync(
            SecurityEventTypes.InvoiceMarkedPaid,
            actorUserId: accountantUserId,
            targetUserId: null,
            targetReference: invoiceId.ToString());

        return new PaymentResult(PaymentOutcome.Success, ToResponse(payment));
    }

    // FR-TUITION-08, D21 mục 2 (bước 3–6). Gửi lại một transactionId đã có thì không xử lý lại: kiểm trước
    // cho trường hợp thường gặp, còn hai lần gửi đồng thời do unique ở database chặn (repository trả null)
    public async Task<BankReconcileOutcome> ReconcileBankTransactionAsync(BankTransactionNotification notification)
    {
        var accountNumber = notification.AccountNumber.Trim();
        if (accountNumber != _paymentAccount.AccountNumber.Trim())
            return BankReconcileOutcome.WrongAccount;

        if (await _tuitionRepository.BankTransactionExistsAsync(notification.TransactionId))
            return BankReconcileOutcome.Accepted;

        var transaction = new BankTransaction
        {
            TransactionId = notification.TransactionId,
            AccountNumber = accountNumber,
            Amount = notification.Amount,
            Content = notification.Content,
            TransactionAt = notification.TransactionAtUtc.ToUniversalTime(),
            ReceivedAt = DateTime.UtcNow
        };

        var saved = await _tuitionRepository.ReconcileBankTransactionAsync(
            transaction, FindPaymentCodes(notification.Content));

        // D50: ghi sau khi transaction đã commit; tự đối soát không có người thực hiện
        if (saved?.Status == BankTransactionStatuses.Matched)
            await _securityEventService.RecordAsync(
                SecurityEventTypes.InvoiceMarkedPaid,
                actorUserId: null,
                targetUserId: null,
                targetReference: saved.InvoiceId.ToString(),
                detail: SecurityEventDetails.BankAuto);

        return BankReconcileOutcome.Accepted;
    }

    public async Task<IReadOnlyList<BankTransactionResponse>> GetBankTransactionsAsync(string? status)
    {
        var transactions = await _tuitionRepository.GetBankTransactionsAsync(status);
        return transactions.Select(ToResponse).ToList();
    }

    // FR-TUITION-09, D21 mục 3: đọc trước để trả đúng 404 hay 409 kèm lý do. Kiểm tra lần nữa bằng điều kiện
    // trong chính các câu UPDATE: hai yêu cầu đồng thời thì yêu cầu thua không đổi gì và nhận 409 chung.
    // Lý do không khớp ban đầu giữ nguyên sau khi gán (UnmatchedReasons)
    public async Task<BankTransactionResult> MatchBankTransactionAsync(Guid id, MatchBankTransactionRequest request,
        Guid accountantUserId)
    {
        var transaction = await _tuitionRepository.FindBankTransactionByIdAsync(id);
        if (transaction is null)
            return new BankTransactionResult(BankTransactionOutcome.TransactionNotFound);

        if (transaction.Status != BankTransactionStatuses.Unmatched)
            return new BankTransactionResult(BankTransactionOutcome.TransactionResolved);

        var invoice = await _tuitionRepository.FindInvoiceByIdAsync(request.InvoiceId);
        if (invoice is null)
            return new BankTransactionResult(BankTransactionOutcome.InvoiceNotFound);

        if (invoice.Status == InvoiceStatuses.Paid)
            return new BankTransactionResult(BankTransactionOutcome.InvoicePaid);

        // Thu đủ, không gạch nợ một phần: chuyển thiếu hay thừa thì Kế toán đánh dấu đã xử lý ngoài hệ thống
        if (invoice.Amount != transaction.Amount)
            return new BankTransactionResult(BankTransactionOutcome.AmountMismatch);

        var matched = await _tuitionRepository.MatchBankTransactionAsync(transaction, invoice.Id,
            accountantUserId, DateTime.UtcNow);
        if (!matched)
            return new BankTransactionResult(BankTransactionOutcome.Conflict);

        // D50: ghi sau khi transaction đã commit
        await _securityEventService.RecordAsync(
            SecurityEventTypes.InvoiceMarkedPaid,
            actorUserId: accountantUserId,
            targetUserId: null,
            targetReference: invoice.Id.ToString(),
            detail: SecurityEventDetails.BankMatched);

        var updated = await _tuitionRepository.FindBankTransactionByIdAsync(id);
        return new BankTransactionResult(BankTransactionOutcome.Success, ToResponse(updated!));
    }

    // Không đổi hóa đơn nào, không hoàn tiền; D50 không có sự kiện cho thao tác này
    public async Task<BankTransactionResult> DismissBankTransactionAsync(Guid id, DismissBankTransactionRequest request,
        Guid accountantUserId)
    {
        var transaction = await _tuitionRepository.FindBankTransactionByIdAsync(id);
        if (transaction is null)
            return new BankTransactionResult(BankTransactionOutcome.TransactionNotFound);

        if (transaction.Status != BankTransactionStatuses.Unmatched)
            return new BankTransactionResult(BankTransactionOutcome.TransactionResolved);

        var dismissed = await _tuitionRepository.DismissBankTransactionAsync(id, request.Note.Trim(),
            accountantUserId, DateTime.UtcNow);
        if (!dismissed)
            return new BankTransactionResult(BankTransactionOutcome.TransactionResolved);

        var updated = await _tuitionRepository.FindBankTransactionByIdAsync(id);
        return new BankTransactionResult(BankTransactionOutcome.Success, ToResponse(updated!));
    }

    // D21 mục 2: chuẩn hóa nội dung (chữ hoa; bỏ khoảng trắng, dấu chấm, gạch ngang) vì ngân hàng và người
    // chuyển hay chèn các ký tự này, rồi lấy mọi chuỗi có dạng mã thanh toán. Quét chồng lấn: nội dung
    // "HPHPK7M2Q9XA" có hai ứng viên HPHPK7M2Q9 và HPK7M2Q9XA, quét thường sẽ bỏ sót mã thật thứ hai
    private static IReadOnlyCollection<string> FindPaymentCodes(string content)
    {
        var normalized = new string(content
            .ToUpperInvariant()
            .Where(c => !char.IsWhiteSpace(c) && c != '.' && c != '-')
            .ToArray());

        return PaymentCodeCandidate.Matches(normalized)
            .Select(m => m.Groups[1].Value)
            .Distinct()
            .ToList();
    }

    // FR-TUITION-05: trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404 (D39 mục 10).
    // Kiểm riêng liên kết để phân biệt trẻ ngoài phạm vi với con mình chưa có hóa đơn nào (danh sách rỗng)
    public async Task<IReadOnlyList<ChildInvoiceResponse>?> GetChildInvoicesForGuardianAsync(
        Guid childId, Guid parentUserId)
    {
        if (!await _childGuardianRepository.LinkExistsAsync(childId, parentUserId))
            return null;

        var invoices = await _tuitionRepository.GetInvoicesOfChildForGuardianAsync(childId, parentUserId);
        return invoices.Select(ToChildInvoiceResponse).ToList();
    }

    // Hóa đơn không tồn tại, thuộc trẻ khác hoặc trẻ không liên kết với mình đều 404 (AC-TUITION-07)
    public async Task<ChildInvoiceResponse?> GetChildInvoiceForGuardianAsync(
        Guid childId, Guid invoiceId, Guid parentUserId)
    {
        var invoice = await _tuitionRepository.FindInvoiceOfChildForGuardianAsync(childId, invoiceId, parentUserId);
        return invoice is null ? null : ToChildInvoiceResponse(invoice);
    }

    // FR-TUITION-07, D21 mục 1: phạm vi như FR-TUITION-05 — hóa đơn không tồn tại, thuộc trẻ khác hoặc trẻ
    // không liên kết với mình đều 404. Hóa đơn đã paid không còn thông tin chuyển khoản → 409 (BR-TUITION-14)
    public async Task<PaymentInstructionResult> GetPaymentInstructionForGuardianAsync(
        Guid childId, Guid invoiceId, Guid parentUserId)
    {
        var invoice = await _tuitionRepository.FindInvoiceOfChildForGuardianAsync(childId, invoiceId, parentUserId);
        if (invoice is null)
            return new PaymentInstructionResult(PaymentInstructionOutcome.InvoiceNotFound);

        if (invoice.Status == InvoiceStatuses.Paid)
            return new PaymentInstructionResult(PaymentInstructionOutcome.InvoicePaid);

        return new PaymentInstructionResult(PaymentInstructionOutcome.Success, new PaymentInstructionResponse(
            _paymentAccount.BankName,
            _paymentAccount.AccountNumber,
            _paymentAccount.AccountName,
            invoice.Amount,
            invoice.PaymentCode,
            BuildQrImageUrl(invoice.Amount, invoice.PaymentCode)));
    }

    // FR-TUITION-03, D39 mục 12: kỳ báo cáo là tháng hiện tại, không có bộ lọc khoảng ngày.
    // Tổng thu tính theo thời điểm thanh toán (D39 mục 4), không theo kỳ thu ghi trong mô tả hóa đơn.
    // Số hóa đơn chưa thanh toán đếm mọi hóa đơn còn unpaid lúc sinh báo cáo: hóa đơn không có cột kỳ,
    // lọc theo issued_at thì khoản nợ của tháng trước biến mất khỏi báo cáo
    public async Task<RevenueReportResponse> GetRevenueReportAsync()
    {
        var generatedAtUtc = DateTime.UtcNow;
        var (year, month, periodStartUtc, periodEndUtc) = VietnamTime.MonthOf(generatedAtUtc);

        var totalCollected = await _tuitionRepository.SumPaymentsAsync(periodStartUtc, periodEndUtc);
        var unpaidInvoiceCount = await _tuitionRepository.CountUnpaidInvoicesAsync();

        return new RevenueReportResponse(year, month, periodStartUtc, periodEndUtc, generatedAtUtc,
            totalCollected, unpaidInvoiceCount);
    }

    private static string NewInvoiceMessage(string childFullName, string description, decimal amount)
        => $"Có hóa đơn mới cho bé {childFullName}: {description}, số tiền {FormatAmount(amount)} đồng.";

    // Ảnh VietQR từ img.vietqr.io (ngoại lệ D11, D17). URL chỉ chứa tài khoản của trường, số tiền và mã
    // thanh toán, không chứa dữ liệu trẻ hay phụ huynh. Số tiền ghi kiểu invariant (1500000, 1500000.5),
    // không có dấu phân cách hàng nghìn
    private string BuildQrImageUrl(decimal amount, string paymentCode)
    {
        var amountText = amount.ToString("0.##", CultureInfo.InvariantCulture);
        return "https://img.vietqr.io/image/"
            + $"{Uri.EscapeDataString(_paymentAccount.BankBin)}-{Uri.EscapeDataString(_paymentAccount.AccountNumber)}"
            + "-compact2.png"
            + $"?amount={Uri.EscapeDataString(amountText)}"
            + $"&addInfo={Uri.EscapeDataString(paymentCode)}"
            + $"&accountName={Uri.EscapeDataString(_paymentAccount.AccountName)}";
    }

    private static string FormatAmount(decimal amount)
        => amount.ToString("#,##0.##", VietnameseNumberFormat);

    private static TuitionFeeResponse ToResponse(TuitionFee fee)
        => new(fee.Id, fee.Description, fee.Amount);

    private static InvoiceResponse ToResponse(Invoice invoice)
        => new(invoice.Id, invoice.ChildId, invoice.Child.FullName, invoice.Amount,
            invoice.Description, invoice.Status, invoice.IssuedAt, invoice.PaymentCode);

    private static ChildInvoiceResponse ToChildInvoiceResponse(Invoice invoice)
        => new(invoice.Id, invoice.Amount, invoice.Description, invoice.Status, invoice.IssuedAt);

    // Invoice chỉ có khi giao dịch đã khớp (CK_BankTransaction_MatchedHasInvoice)
    private static BankTransactionResponse ToResponse(BankTransaction transaction)
        => new(transaction.Id, transaction.TransactionId, transaction.Amount, transaction.Content,
            transaction.TransactionAt, transaction.Status, transaction.UnmatchedReason,
            transaction.ResolutionNote, transaction.ResolvedAt, transaction.InvoiceId,
            transaction.Invoice?.PaymentCode, transaction.Invoice?.Description, transaction.Invoice?.Child.FullName);

    private static PaymentResponse ToResponse(Payment payment)
        => new(payment.Id, payment.InvoiceId, payment.Amount, payment.PaymentMethod,
            payment.ExternalReference, payment.PaidAt);
}
