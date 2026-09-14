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