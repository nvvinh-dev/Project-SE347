using NhaTre.Application.Interfaces;

namespace NhaTre.API.Services;

// Hiện thực IRequestContext bằng HttpContext của request đang xử lý. Cùng nguồn IP với
// rate limit đăng nhập (D54).
public class HttpRequestContext : IRequestContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpRequestContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? IpAddress =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}
