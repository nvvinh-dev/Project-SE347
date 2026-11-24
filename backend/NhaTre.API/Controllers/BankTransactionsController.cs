using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// FR-TUITION-09, D21 mục 3: chỉ Kế toán xem giao dịch ngân hàng và xử lý giao dịch chưa tự khớp (gán vào
// một hóa đơn hoặc đánh dấu đã xử lý ngoài hệ thống). Không tạo, sửa hay xóa giao dịch: giao dịch chỉ vào
// qua webhook (FR-TUITION-08). Gán và đánh dấu là hành động nghiệp vụ nên là POST, thành công trả 200,
// không hoàn tác được (BR-TUITION-16)
[ApiController]
[Route("api/bank-transactions")]
[Authorize(Roles = Roles.Accountant)]
public class BankTransactionsController : ControllerBase
{
    private readonly ITuitionService _tuitionService;
    private readonly IValidator<MatchBankTransactionRequest> _matchValidator;
    private readonly IValidator<DismissBankTransactionRequest> _dismissValidator;

    public BankTransactionsController(
        ITuitionService tuitionService,
        IValidator<MatchBankTransactionRequest> matchValidator,
        IValidator<DismissBankTransactionRequest> dismissValidator)
    {
        _tuitionService = tuitionService;
        _matchValidator = matchValidator;
        _dismissValidator = dismissValidator;
    }

    // Không phân trang: trả toàn bộ, mới nhất trước
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BankTransactionResponse>>>> GetBankTransactions(
        [FromQuery] string? status)
    {
        if (status is not null && !BankTransactionStatuses.IsValid(status))
            return BadRequest(ApiResponse<IReadOnlyList<BankTransactionResponse>>.Fail(
                new[] { "Trạng thái giao dịch chỉ nhận 'Matched', 'Unmatched' hoặc 'Dismissed'." }));

        var result = await _tuitionService.GetBankTransactionsAsync(status);
        return Ok(ApiResponse<IReadOnlyList<BankTransactionResponse>>.Ok(result));
    }

    [HttpPost("{id:guid}/match")]
    public async Task<ActionResult<ApiResponse<BankTransactionResponse>>> Match(
        Guid id, [FromBody] MatchBankTransactionRequest request)
    {
        var validationResult = await _matchValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<BankTransactionResponse>.Fail(errors));
        }

        var result = await _tuitionService.MatchBankTransactionAsync(id, request, CurrentUserId());
        return ToActionResult(result);
    }

    [HttpPost("{id:guid}/dismiss")]
    public async Task<ActionResult<ApiResponse<BankTransactionResponse>>> Dismiss(
        Guid id, [FromBody] DismissBankTransactionRequest request)
    {
        var validationResult = await _dismissValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<BankTransactionResponse>.Fail(errors));
        }

        var result = await _tuitionService.DismissBankTransactionAsync(id, request, CurrentUserId());
        return ToActionResult(result);
    }

    private ActionResult<ApiResponse<BankTransactionResponse>> ToActionResult(BankTransactionResult result)
        => result.Outcome switch
        {
            BankTransactionOutcome.Success => Ok(ApiResponse<BankTransactionResponse>.Ok(result.Transaction!)),
            BankTransactionOutcome.TransactionNotFound => NotFound(ApiResponse<BankTransactionResponse>.Fail(
                "Không tìm thấy giao dịch.")),
            BankTransactionOutcome.InvoiceNotFound => NotFound(ApiResponse<BankTransactionResponse>.Fail(
                "Không tìm thấy hóa đơn.")),
            BankTransactionOutcome.TransactionResolved => Conflict(ApiResponse<BankTransactionResponse>.Fail(
                "Giao dịch đã được xử lý, không xử lý lại được.")),
            BankTransactionOutcome.InvoicePaid => Conflict(ApiResponse<BankTransactionResponse>.Fail(
                "Hóa đơn đã được thanh toán, không gán giao dịch vào được.")),
            BankTransactionOutcome.AmountMismatch => Conflict(ApiResponse<BankTransactionResponse>.Fail(
                "Số tiền giao dịch khác số tiền hóa đơn, không gán được.")),
            BankTransactionOutcome.Conflict => Conflict(ApiResponse<BankTransactionResponse>.Fail(
                "Giao dịch hoặc hóa đơn vừa được xử lý ở nơi khác. Hãy tải lại để xem trạng thái mới.")),
            _ => throw new InvalidOperationException($"Kết quả đối soát giao dịch không xử lý: {result.Outcome}")
        };

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
