using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using NhaTre.Application.Common;

namespace NhaTre.API.Filters;

// D21 mục 2, bước 1: webhook ngân hàng không có JWT, bên gọi chứng minh mình giữ khóa bằng header
// X-Signature = HMAC-SHA256 dạng hex của nguyên body. Đây là authorization filter nên chạy trước model
// binding: request thiếu hoặc sai chữ ký dừng ở đây với 401, kể cả khi body hỏng, trước khi body được đọc
// thành DTO hay validator chạy. Không ghi chữ ký hay body vào log (D45 mục 5)
public sealed class BankWebhookSignatureFilter : IAsyncAuthorizationFilter
{
    public const string HeaderName = "X-Signature";

    // HMAC-SHA256 ra 32 byte, viết hex là 64 ký tự
    private const int SignatureHexLength = HMACSHA256.HashSizeInBytes * 2;

    private readonly BankWebhookSettings _settings;
    private readonly ILogger<BankWebhookSignatureFilter> _logger;

    public BankWebhookSignatureFilter(BankWebhookSettings settings, ILogger<BankWebhookSignatureFilter> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var request = context.HttpContext.Request;

        var provided = ParseSignature(request.Headers[HeaderName]);
        if (provided is null)
        {
            Reject(context, "thiếu chữ ký hoặc chữ ký không đúng dạng hex 64 ký tự");
            return;
        }

        // Body chỉ đọc được một lần: bật buffering, đọc hết để tính HMAC rồi tua về đầu cho model binding
        request.EnableBuffering();
        var expected = await HMACSHA256.HashDataAsync(
            _settings.SecretKey, request.Body, context.HttpContext.RequestAborted);
        request.Body.Position = 0;

        // So trong thời gian cố định: so thường dừng ở byte sai đầu tiên, đo thời gian là dò được chữ ký
        if (!CryptographicOperations.FixedTimeEquals(expected, provided))
            Reject(context, "chữ ký không khớp với body");
    }

    // Đúng một header, đủ 64 ký tự hex (hoa hay thường đều được); khác đi là không có chữ ký
    private static byte[]? ParseSignature(Microsoft.Extensions.Primitives.StringValues values)
    {
        if (values.Count != 1)
            return null;

        var hex = values[0];
        if (hex is null || hex.Length != SignatureHexLength || !hex.All(char.IsAsciiHexDigit))
            return null;

        return Convert.FromHexString(hex);
    }

    // Cùng một message cho mọi lý do: bên gọi không cần biết sai ở đâu, lý do chỉ ghi vào log
    private void Reject(AuthorizationFilterContext context, string reason)
    {
        _logger.LogWarning(
            "Webhook ngân hàng bị từ chối ({Reason}), IP {RemoteIp}",
            reason,
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

        context.Result = new UnauthorizedObjectResult(
            ApiResponse<object>.Fail("Thiếu hoặc sai chữ ký xác thực của ngân hàng."));
    }
}
