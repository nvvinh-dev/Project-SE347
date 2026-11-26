using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Học phí gồm các tài nguyên tuition-fees, invoices, revenue-reports và hóa đơn theo con
// của phụ huynh (children/{childId}/invoices), nên route gốc của Controller là api/ và mỗi action
// tự ghi tên tài nguyên. Hai vai trò dùng chung nên Roles gắn theo từng action; [Authorize] ở mức
// class để action nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// Chỉ Kế toán quản lý biểu phí (FR-TUITION-01) và hóa đơn (FR-TUITION-02):
// Tạo + Sửa + Xem, không Xóa — D40 mục 1.
// Chỉ Kế toán sinh và xem báo cáo doanh thu (FR-TUITION-03); Admin xem doanh thu qua dashboard
// FR-TUITION-05: Phụ huynh chỉ xem hóa đơn của con mình (child_guardians, D39 mục 10), không thanh
// toán trong hệ thống (D21)
// FR-TUITION-06: chỉ Kế toán ghi nhận khoản phụ huynh đã nộp, là đường duy nhất để hóa đơn sang paid (D21)
// FR-TUITION-07: chỉ Phụ huynh xem thông tin chuyển khoản theo mã thanh toán của hóa đơn con mình (D21 mục 1)
// FR-TUITION-10: chỉ Kế toán lập hóa đơn hàng loạt cho một lớp, một khối hoặc toàn trường (D39 mục 21)
[ApiController]
[Route("api")]
[Authorize]
public class TuitionController : ControllerBase
{
    private readonly ITuitionService _tuitionService;
    private readonly IValidator<TuitionFeeRequest> _tuitionFeeValidator;
    private readonly IValidator<InvoiceRequest> _invoiceValidator;
    private readonly IValidator<BulkInvoiceRequest> _bulkInvoiceValidator;
    private readonly IValidator<RecordPaymentRequest> _recordPaymentValidator;

    public TuitionController(
        ITuitionService tuitionService,
        IValidator<TuitionFeeRequest> tuitionFeeValidator,
        IValidator<InvoiceRequest> invoiceValidator,
        IValidator<BulkInvoiceRequest> bulkInvoiceValidator,
        IValidator<RecordPaymentRequest> recordPaymentValidator)
    {
        _tuitionService = tuitionService;
        _tuitionFeeValidator = tuitionFeeValidator;
        _invoiceValidator = invoiceValidator;
        _bulkInvoiceValidator = bulkInvoiceValidator;
        _recordPaymentValidator = recordPaymentValidator;
    }

    [HttpGet("tuition-fees")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TuitionFeeResponse>>>> GetFees()
    {
        var result = await _tuitionService.GetFeesAsync();
        return Ok(ApiResponse<IReadOnlyList<TuitionFeeResponse>>.Ok(result));
    }

    [HttpGet("tuition-fees/{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> GetFeeById(Guid id)
    {
        var result = await _tuitionService.GetFeeByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<TuitionFeeResponse>.Fail("Không tìm thấy biểu phí."));

        return Ok(ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpPost("tuition-fees")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> CreateFee([FromBody] TuitionFeeRequest request)
    {
        var validationResult = await _tuitionFeeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<TuitionFeeResponse>.Fail(errors));
        }

        var result = await _tuitionService.CreateFeeAsync(request);

        if (result is null)
            return Conflict(ApiResponse<TuitionFeeResponse>.Fail(
                "Trường đã có biểu phí. Hãy sửa mức phí hiện có thay vì tạo mới."));

        return CreatedAtAction(nameof(GetFeeById), new { id = result.Id },
            ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpPut("tuition-fees/{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> UpdateFee(Guid id, [FromBody] TuitionFeeRequest request)
    {
        var validationResult = await _tuitionFeeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<TuitionFeeResponse>.Fail(errors));
        }

        var result = await _tuitionService.UpdateFeeAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<TuitionFeeResponse>.Fail("Không tìm thấy biểu phí."));

        return Ok(ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpGet("invoices")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<InvoiceResponse>>>> GetInvoices(
        [FromQuery] Guid? childId, [FromQuery] string? status)
    {
        if (status is not null && !InvoiceStatuses.IsValid(status))
            return BadRequest(ApiResponse<IReadOnlyList<InvoiceResponse>>.Fail(
                new[] { "Trạng thái hóa đơn chỉ nhận 'unpaid' hoặc 'paid'." }));

        var result = await _tuitionService.GetInvoicesAsync(childId, status);
        return Ok(ApiResponse<IReadOnlyList<InvoiceResponse>>.Ok(result));
    }

    [HttpGet("invoices/{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<InvoiceResponse>>> GetInvoiceById(Guid id)
    {
        var result = await _tuitionService.GetInvoiceByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<InvoiceResponse>.Fail("Không tìm thấy hóa đơn."));

        return Ok(ApiResponse<InvoiceResponse>.Ok(result));
    }

    [HttpPost("invoices")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<InvoiceResponse>>> CreateInvoice([FromBody] InvoiceRequest request)
    {
        var validationResult = await _invoiceValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<InvoiceResponse>.Fail(errors));
        }

        var result = await _tuitionService.CreateInvoiceAsync(request);

        return result.Outcome switch
        {
            InvoiceOutcome.Success => CreatedAtAction(nameof(GetInvoiceById), new { id = result.Invoice!.Id },
                ApiResponse<InvoiceResponse>.Ok(result.Invoice)),
            InvoiceOutcome.ChildNotFound => NotFound(ApiResponse<InvoiceResponse>.Fail("Không tìm thấy trẻ.")),
            InvoiceOutcome.TuitionFeeMissing => Conflict(ApiResponse<InvoiceResponse>.Fail(
                "Chưa có biểu phí. Hãy tạo biểu phí trước khi lập hóa đơn.")),
            _ => throw new InvalidOperationException($"Kết quả tạo hóa đơn không xử lý: {result.Outcome}")
        };
    }

    [HttpPut("invoices/{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<InvoiceResponse>>> UpdateInvoice(Guid id, [FromBody] InvoiceRequest request)
    {
        var validationResult = await _invoiceValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<InvoiceResponse>.Fail(errors));
        }

        var result = await _tuitionService.UpdateInvoiceAsync(id, request);

        return result.Outcome switch
        {
            InvoiceOutcome.Success => Ok(ApiResponse<InvoiceResponse>.Ok(result.Invoice!)),
            InvoiceOutcome.InvoiceNotFound => NotFound(ApiResponse<InvoiceResponse>.Fail("Không tìm thấy hóa đơn.")),
            InvoiceOutcome.ChildNotFound => NotFound(ApiResponse<InvoiceResponse>.Fail("Không tìm thấy trẻ.")),
            InvoiceOutcome.InvoicePaid => Conflict(ApiResponse<InvoiceResponse>.Fail(
                "Hóa đơn đã thanh toán, không sửa được số tiền, mô tả hay trẻ.")),
            _ => throw new InvalidOperationException($"Kết quả sửa hóa đơn không xử lý: {result.Outcome}")
        };
    }

    // FR-TUITION-10: xem trước không ghi gì nên trả 200, kể cả khi không còn trẻ nào để lập
    [HttpPost("invoices/bulk/preview")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<BulkInvoicePreviewResponse>>> PreviewBulkInvoices(
        [FromBody] BulkInvoiceRequest request)
    {
        var validationResult = await _bulkInvoiceValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<BulkInvoicePreviewResponse>.Fail(errors));
        }

        var result = await _tuitionService.PreviewBulkInvoicesAsync(request);

        return result.Outcome switch
        {
            BulkInvoiceOutcome.Success => Ok(ApiResponse<BulkInvoicePreviewResponse>.Ok(result.Preview!)),
            _ => BulkInvoiceNotFound<BulkInvoicePreviewResponse>(result.Outcome)
        };
    }

    // FR-TUITION-10: lô hóa đơn không có route xem lại chung nên 201 không kèm Location; từng hóa đơn
    // xem lại qua GET invoices
    [HttpPost("invoices/bulk")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<BulkInvoiceResponse>>> CreateBulkInvoices(
        [FromBody] BulkInvoiceRequest request)
    {
        var validationResult = await _bulkInvoiceValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<BulkInvoiceResponse>.Fail(errors));
        }

        var result = await _tuitionService.CreateBulkInvoicesAsync(request);

        return result.Outcome switch
        {
            BulkInvoiceOutcome.Success => StatusCode(StatusCodes.Status201Created,
                ApiResponse<BulkInvoiceResponse>.Ok(result.Result!)),
            BulkInvoiceOutcome.NothingToCreate => Conflict(ApiResponse<BulkInvoiceResponse>.Fail(
                "Không còn trẻ nào trong phạm vi đã chọn để lập hóa đơn: phạm vi chưa có trẻ hoặc mọi trẻ đã có hóa đơn cùng mô tả.")),
            _ => BulkInvoiceNotFound<BulkInvoiceResponse>(result.Outcome)
        };
    }

    private NotFoundObjectResult BulkInvoiceNotFound<T>(BulkInvoiceOutcome outcome) => outcome switch
    {
        BulkInvoiceOutcome.TuitionFeeNotFound => NotFound(ApiResponse<T>.Fail("Không tìm thấy biểu phí.")),
        BulkInvoiceOutcome.ClassNotFound => NotFound(ApiResponse<T>.Fail("Không tìm thấy lớp.")),
        BulkInvoiceOutcome.GradeLevelNotFound => NotFound(ApiResponse<T>.Fail("Không tìm thấy khối.")),
        _ => throw new InvalidOperationException($"Kết quả lập hóa đơn hàng loạt không xử lý: {outcome}")
    };

    // FR-TUITION-06: hành động nghiệp vụ riêng trên hóa đơn nên là POST, thành công trả 200. Ghi nhận rồi
    // thì không sửa, không xóa được (BR-TUITION-13)
    [HttpPost("invoices/{id:guid}/record-payment")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> RecordPayment(Guid id, [FromBody] RecordPaymentRequest request)
    {
        var validationResult = await _recordPaymentValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<PaymentResponse>.Fail(errors));
        }

        var result = await _tuitionService.RecordPaymentAsync(id, request, CurrentUserId());

        return result.Outcome switch
        {
            PaymentOutcome.Success => Ok(ApiResponse<PaymentResponse>.Ok(result.Payment!)),
            PaymentOutcome.InvoiceNotFound => NotFound(ApiResponse<PaymentResponse>.Fail("Không tìm thấy hóa đơn.")),
            PaymentOutcome.InvoicePaid => Conflict(ApiResponse<PaymentResponse>.Fail(
                "Hóa đơn đã được ghi nhận thanh toán, không ghi nhận lại được.")),
            _ => throw new InvalidOperationException($"Kết quả ghi nhận thanh toán không xử lý: {result.Outcome}")
        };
    }

    // Trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404; con mình chưa có hóa đơn nào
    // thì danh sách rỗng
    [HttpGet("children/{childId:guid}/invoices")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChildInvoiceResponse>>>> GetChildInvoices(Guid childId)
    {
        var result = await _tuitionService.GetChildInvoicesForGuardianAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<ChildInvoiceResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<ChildInvoiceResponse>>.Ok(result));
    }

    // Đổi id hóa đơn hay id trẻ trên URL sang dữ liệu ngoài phạm vi đều 404 (AC-TUITION-07)
    [HttpGet("children/{childId:guid}/invoices/{invoiceId:guid}")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<ChildInvoiceResponse>>> GetChildInvoiceById(Guid childId, Guid invoiceId)
    {
        var result = await _tuitionService.GetChildInvoiceForGuardianAsync(childId, invoiceId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<ChildInvoiceResponse>.Fail("Không tìm thấy hóa đơn."));

        return Ok(ApiResponse<ChildInvoiceResponse>.Ok(result));
    }

    // Phạm vi như xem một hóa đơn: ngoài phạm vi → 404 (AC-TUITION-19). Hóa đơn đã paid → 409 (AC-TUITION-18)
    [HttpGet("children/{childId:guid}/invoices/{invoiceId:guid}/payment-instruction")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<PaymentInstructionResponse>>> GetPaymentInstruction(
        Guid childId, Guid invoiceId)
    {
        var result = await _tuitionService.GetPaymentInstructionForGuardianAsync(childId, invoiceId, CurrentUserId());

        return result.Outcome switch
        {
            PaymentInstructionOutcome.Success => Ok(ApiResponse<PaymentInstructionResponse>.Ok(result.Instruction!)),
            PaymentInstructionOutcome.InvoiceNotFound => NotFound(ApiResponse<PaymentInstructionResponse>.Fail(
                "Không tìm thấy hóa đơn.")),
            PaymentInstructionOutcome.InvoicePaid => Conflict(ApiResponse<PaymentInstructionResponse>.Fail(
                "Hóa đơn đã được thanh toán, không còn thông tin chuyển khoản.")),
            _ => throw new InvalidOperationException($"Kết quả xem thông tin chuyển khoản không xử lý: {result.Outcome}")
        };
    }

    // Báo cáo không lưu vào bảng nào, mỗi lần gọi tính lại cho tháng hiện tại (D39 mục 12)
    [HttpGet("revenue-reports/current")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<RevenueReportResponse>>> GetCurrentRevenueReport()
    {
        var result = await _tuitionService.GetRevenueReportAsync();
        return Ok(ApiResponse<RevenueReportResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
