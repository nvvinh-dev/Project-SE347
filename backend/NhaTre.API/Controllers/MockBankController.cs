using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.MockBank;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// D57: Ngân hàng giả lập, chỉ có khi chạy Development và bật MockBank:Enabled. Ngoài hai điều kiện đó
// Program.cs gỡ controller này khỏi danh sách controller (MockBankControllerRemover), nên route không tồn tại
// và trả 404 như mọi đường dẫn lạ (AC-SEC-04, D46 mục 2)
[ApiController]
[Route("api/mock-bank")]
public class MockBankController : ControllerBase
{
    private readonly IMockBankService _mockBankService;
    private readonly IValidator<MockBankTransferRequest> _validator;

    public MockBankController(IMockBankService mockBankService, IValidator<MockBankTransferRequest> validator)
    {
        _mockBankService = mockBankService;
        _validator = validator;
    }

    // Không kiểm phạm vi trẻ hay hóa đơn: như ngân hàng thật, ai cũng chuyển được tiền vào tài khoản của trường
    // với nội dung tùy ý; giao dịch khớp hóa đơn nào là việc của đối soát. 200 kèm biên lai khi webhook nhận
    // (2xx), không kèm kết quả đối soát. Webhook không trả 2xx → 502, coi như giao dịch chưa xảy ra
    [HttpPost("transfers")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<MockBankReceipt>>> Transfer([FromBody] MockBankTransferRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<MockBankReceipt>.Fail(errors));
        }

        var result = await _mockBankService.TransferAsync(request);

        return result.Outcome switch
        {
            MockBankTransferOutcome.Delivered => Ok(ApiResponse<MockBankReceipt>.Ok(
                result.Receipt!, "Chuyển khoản thành công.")),
            MockBankTransferOutcome.WebhookFailed => StatusCode(StatusCodes.Status502BadGateway, ApiResponse<MockBankReceipt>.Fail(
                "Ngân hàng giả lập chưa gửi được giao dịch tới hệ thống nhà trường nên giao dịch chưa được thực hiện. Vui lòng thử lại sau.")),
            _ => throw new InvalidOperationException($"Kết quả chuyển khoản giả lập không xử lý: {result.Outcome}")
        };
    }
}
