namespace NhaTre.Application.Interfaces;

// Thông tin của request hiện tại cho tầng Application, vốn không tham chiếu ASP.NET Core.
// Hiện thực ở tầng Api.
public interface IRequestContext
{
    // Rỗng khi không có request (ví dụ chạy ngoài một HTTP request)
    string? IpAddress { get; }
}
