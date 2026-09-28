using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// Module Học phí gồm hai tài nguyên tuition-fees và invoices, nên route gốc của Controller
// là api/ và mỗi action tự ghi tên tài nguyên.
// Chỉ Kế toán quản lý biểu phí (FR-TUITION-01) và hóa đơn (FR-TUITION-02):
// Tạo + Sửa + Xem, không Xóa — D40 mục 1
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Accountant)]
public class TuitionController : ControllerBase
{
    private readonly ITuitionService _tuitionService;
    private readonly IValidator<TuitionFeeRequest> _tuitionFeeValidator;
    private readonly IValidator<InvoiceRequest> _invoiceValidator;

    public TuitionController(
        ITuitionService tuitionService,
        IValidator<TuitionFeeRequest> tuitionFeeValidator,
        IValidator<InvoiceRequest> invoiceValidator)
    {
        _tuitionService = tuitionService;
        _tuitionFeeValidator = tuitionFeeValidator;
        _invoiceValidator = invoiceValidator;
    }

    [HttpGet("tuition-fees")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TuitionFeeResponse>>>> GetFees()
    {
        var result = await _tuitionService.GetFeesAsync();
        return Ok(ApiResponse<IReadOnlyList<TuitionFeeResponse>>.Ok(result));
    }

    [HttpGet("tuition-fees/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> GetFeeById(Guid id)
    {
        var result = await _tuitionService.GetFeeByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<TuitionFeeResponse>.Fail("Không tìm thấy biểu phí."));

        return Ok(ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpPost("tuition-fees")]
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
    public async Task<ActionResult<ApiResponse<InvoiceResponse>>> GetInvoiceById(Guid id)
    {
        var result = await _tuitionService.GetInvoiceByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<InvoiceResponse>.Fail("Không tìm thấy hóa đơn."));

        return Ok(ApiResponse<InvoiceResponse>.Ok(result));
    }

    [HttpPost("invoices")]
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
}
