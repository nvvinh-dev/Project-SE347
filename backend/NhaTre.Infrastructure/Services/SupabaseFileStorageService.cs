using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Infrastructure.Services;

// Hiện thực IFileStorageService bằng REST API của Supabase Storage, gọi qua HttpClient có sẵn
// của .NET — không thêm SDK (D35). Bucket "photos" đặt private, không có policy truy cập: chỉ
// backend đọc ghi được bằng service key (D22, D53).
public class SupabaseFileStorageService : IFileStorageService
{
    private const string BucketName = "photos"; // D22: một bucket chung cho cả ba loại ảnh
    private const int SignedUrlLifetimeSeconds = 60 * 60; // D53: URL ký hạn 60 phút

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public SupabaseFileStorageService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> UploadAsync(Stream content, string folder, string contentType)
    {
        if (!StorageFolders.IsValid(folder))
            throw new ArgumentException($"Thư mục lưu ảnh không hợp lệ: '{folder}'.", nameof(folder));

        // D22: phần mở rộng theo loại ảnh, tên do backend sinh (D44 mục 2) nên không trùng
        // và không chứa ký tự lạ từ client.
        var extension = contentType switch
        {
            ImageContentTypes.Jpeg => ".jpg",
            ImageContentTypes.Png => ".png",
            _ => throw new ArgumentException($"Định dạng ảnh không hỗ trợ: '{contentType}'.", nameof(contentType)),
        };
        var fileReference = $"{folder}/{Guid.NewGuid():N}{extension}";

        var settings = ReadSettings();
        using var request = CreateRequest(HttpMethod.Post, $"{settings.StorageUrl}/object/{BucketName}/{fileReference}", settings.ServiceKey);
        request.Content = new StreamContent(content);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Headers.Add("x-upsert", "false"); // không bao giờ ghi đè file đã có

        using var response = await _httpClient.SendAsync(request);
        await EnsureSuccessAsync(response, "upload ảnh");

        return fileReference;
    }

    public async Task<string> GetSignedUrlAsync(string fileReference)
    {
        if (string.IsNullOrWhiteSpace(fileReference))
            throw new ArgumentException("Thiếu khóa file.", nameof(fileReference));

        var settings = ReadSettings();
        using var request = CreateRequest(HttpMethod.Post, $"{settings.StorageUrl}/object/sign/{BucketName}/{fileReference}", settings.ServiceKey);
        request.Content = JsonContent.Create(new { expiresIn = SignedUrlLifetimeSeconds });

        using var response = await _httpClient.SendAsync(request);
        await EnsureSuccessAsync(response, "tạo URL ký");

        var body = await response.Content.ReadFromJsonAsync<SignedUrlResponse>();
        if (string.IsNullOrEmpty(body?.SignedUrl))
            throw new InvalidOperationException("Supabase Storage không trả về URL ký.");

        // Supabase trả đường dẫn tương đối "/object/sign/photos/...?token=...", phải ghép với
        // gốc ".../storage/v1" mới thành URL frontend mở được.
        return $"{settings.StorageUrl}{body.SignedUrl}";
    }

    public async Task DeleteAsync(string fileReference)
    {
        if (string.IsNullOrWhiteSpace(fileReference))
            throw new ArgumentException("Thiếu khóa file.", nameof(fileReference));

        var settings = ReadSettings();
        using var request = CreateRequest(HttpMethod.Delete, $"{settings.StorageUrl}/object/{BucketName}", settings.ServiceKey);
        // Xóa theo đúng tên file trong danh sách. File không tồn tại thì Supabase vẫn trả 200
        // với danh sách rỗng, nên gọi xóa hai lần không lỗi.
        request.Content = JsonContent.Create(new { prefixes = new[] { fileReference } });

        using var response = await _httpClient.SendAsync(request);
        await EnsureSuccessAsync(response, "xóa ảnh");
    }

    // CỐ Ý đọc cấu hình lúc gọi hàm, KHÔNG kiểm tra lúc khởi động như Jwt:Key ở Program.cs:
    // service key chỉ cấp cho người làm phần ảnh (D53), máy không có key vẫn phải chạy được
    // các chức năng khác. Thiếu key thì chỉ request đụng tới ảnh lỗi 500, log ghi rõ lý do.
    private (string StorageUrl, string ServiceKey) ReadSettings()
    {
        var projectUrl = _configuration["Supabase:Url"];
        var serviceKey = _configuration["Supabase:ServiceKey"];
        if (string.IsNullOrWhiteSpace(projectUrl) || string.IsNullOrWhiteSpace(serviceKey))
            throw new InvalidOperationException(
                "Thiếu cấu hình Supabase:Url hoặc Supabase:ServiceKey trong user-secrets — chức năng ảnh không chạy được.");

        return ($"{projectUrl.TrimEnd('/')}/storage/v1", serviceKey);
    }

    private static HttpRequestMessage CreateRequest(HttpMethod method, string url, string serviceKey)
    {
        var request = new HttpRequestMessage(method, url);
        // Supabase cần key ở cả hai header: "apikey" để qua cổng API, "Authorization" để Storage
        // nhận quyền service (bỏ qua policy của bucket).
        request.Headers.Add("apikey", serviceKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceKey);
        return request;
    }

    // Lỗi từ Supabase là lỗi hệ thống, để GlobalExceptionHandler trả 500 và ghi log. Nội dung
    // lỗi của Supabase chỉ nằm trong log phía server, không tới client (NFR-SEC-03).
    private static async Task EnsureSuccessAsync(HttpResponseMessage response, string action)
    {
        if (response.IsSuccessStatusCode)
            return;

        var detail = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException(
            $"Supabase Storage trả {(int)response.StatusCode} khi {action}: {detail}");
    }

    private sealed record SignedUrlResponse([property: JsonPropertyName("signedURL")] string? SignedUrl);
}
