using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NhaTre.API.Filters;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;

namespace NhaTre.API.Controllers;

// FR-TUITION-08, D21 mục 2: ngân hàng (hoặc dịch vụ theo dõi tài khoản) báo tiền vào tài khoản của trường.
// Endpoint thứ hai gọi được khi chưa có JWT, sau login: bên gọi xác thực bằng chữ ký X-Signature, kiểm ở
// BankWebhookSignatureFilter trước model binding. Controller chỉ kiểm hình dạng body rồi chuyển cho
// TuitionService; logic đối soát và việc ghi database thuộc module Học phí
[ApiController]
[Route("api/bank-webhooks")]
public class BankWebhooksController : ControllerBase
{
    private readonly ITuitionService _tuitionService;
    private readonly IValidator<BankTransactionNotification> _validator;

    public BankWebhooksController(
        ITuitionService tuitionService,
        IValidator<BankTransactionNotification> validator)
    {
        _tuitionService = tuitionService;
        _validator = validator;
    }

    // Thứ tự D21 mục 2: thiếu/sai chữ ký → 401 (filter, không lưu gì); body sai → 400; tài khoản nhận không
    // phải của trường → 400, không lưu. Còn lại 200 chỉ báo đã nhận (D45): gồm khớp hóa đơn, không khớp và
    // gửi lại một transactionId đã có, để ngân hàng không gửi lại mãi một giao dịch không khớp
    [HttpPost("transactions")]
    [AllowAnonymous]
    [EnableRateLimiting("WebhookPolicy")] // D54: 60 lần / 1 phút / 1 IP — cấu hình ở Program.cs
    [TypeFilter(typeof(BankWebhookSignatureFilter))]
    public async Task<ActionResult<ApiResponse<object?>>> ReceiveTransaction(
        [FromBody] BankTransactionNotification request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<object?>.Fail(errors));
        }

        var outcome = await _tuitionService.ReconcileBankTransactionAsync(request);

        return outcome switch
        {
            BankReconcileOutcome.Accepted => Ok(ApiResponse<object?>.Ok(null, "Đã nhận giao dịch.")),
            BankReconcileOutcome.WrongAccount => BadRequest(ApiResponse<object?>.Fail(
                "Số tài khoản nhận không phải tài khoản của nhà trường.")),
            _ => throw new InvalidOperationException($"Kết quả đối soát giao dịch không xử lý: {outcome}")
        };
    }
}
