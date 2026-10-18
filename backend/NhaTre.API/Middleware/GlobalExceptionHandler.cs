using Microsoft.AspNetCore.Diagnostics;
using NhaTre.Application.Common;

namespace NhaTre.API.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Body quá lớn, chunk hỏng... là lỗi của client, không phải lỗi hệ thống: giữ nguyên status 4xx
        // Kestrel đã chọn (413...), log mức Warning và không lộ chi tiết nội bộ (NFR-SEC-03)
        if (exception is BadHttpRequestException badRequest && badRequest.StatusCode is >= 400 and < 500)
        {
            _logger.LogWarning("Request bị từ chối ({StatusCode}) tại {Path}: {Message}",
                badRequest.StatusCode, httpContext.Request.Path, badRequest.Message);

            httpContext.Response.StatusCode = badRequest.StatusCode;
            httpContext.Response.ContentType = "application/json";

            var clientMessage = badRequest.StatusCode == StatusCodes.Status413PayloadTooLarge
                ? "Dung lượng dữ liệu gửi lên vượt quá giới hạn cho phép."
                : "Yêu cầu không hợp lệ.";

            await httpContext.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(clientMessage), cancellationToken);
            return true;
        }

        _logger.LogError(
            exception,
            "Lỗi chưa xử lý tại {Path}: {Message}",
            httpContext.Request.Path,
            exception.Message);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/json";

        var response = ApiResponse<object>.Fail(
            "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau. Nếu lỗi tiếp diễn, liên hệ quản trị viên.");

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }
}