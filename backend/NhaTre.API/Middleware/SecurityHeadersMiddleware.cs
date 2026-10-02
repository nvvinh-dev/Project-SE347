namespace NhaTre.API.Middleware;

// D55: gắn hai header bảo mật cho mọi response của API.
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task InvokeAsync(HttpContext context)
    {
        // Gắn trong OnStarting thay vì gắn thẳng: UseExceptionHandler gọi Response.Clear()
        // trước khi ghi lỗi 500, xóa luôn header đã gắn sớm. OnStarting chạy đúng lúc
        // header được gửi đi nên response nào cũng mang đủ hai header.
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.XContentTypeOptions = "nosniff"; // không cho trình duyệt đoán lại kiểu nội dung
            context.Response.Headers.XFrameOptions = "DENY";          // không cho nhúng vào iframe của trang khác
            return Task.CompletedTask;
        });

        return _next(context);
    }
}
