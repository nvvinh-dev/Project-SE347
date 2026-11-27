using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;

namespace NhaTre.Infrastructure.Services;

// D57: Ngân hàng giả lập gửi giao dịch vào webhook D21 mục 2 bằng HTTP như ngân hàng thật, gồm cả chữ ký:
// X-Signature = HMAC-SHA256 dạng hex của nguyên body, ký bằng cùng BankWebhook:SecretKey mà
// BankWebhookSignatureFilter dùng để kiểm. Không ghi body hay chữ ký vào log (D45 mục 5)
public sealed class MockBankWebhookClient : IMockBankWebhookClient
{
    // Trùng BankWebhookSignatureFilter.HeaderName; Infrastructure không tham chiếu được project Api
    private const string SignatureHeader = "X-Signature";

    // Cùng quy ước JSON với model binding của webhook: camelCase, DateTime UTC viết kèm "Z"
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly MockBankSettings _settings;
    private readonly ILogger<MockBankWebhookClient> _logger;

    public MockBankWebhookClient(HttpClient httpClient, MockBankSettings settings, ILogger<MockBankWebhookClient> logger)
    {
        _httpClient = httpClient;
        _settings = settings;
        _logger = logger;
    }

    public async Task<bool> SendAsync(BankTransactionNotification notification)
    {
        // Ký đúng mảng byte sẽ gửi đi: đổi sang JSON một lần rồi gửi chính mảng đó. PostAsJsonAsync tự đổi sang
        // JSON thêm lần nữa, byte gửi đi có thể khác byte đã ký và webhook trả 401
        var body = JsonSerializer.SerializeToUtf8Bytes(notification, JsonOptions);
        var signature = Convert.ToHexStringLower(HMACSHA256.HashData(_settings.SigningKey, body));

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.WebhookUrl);
        request.Content = new ByteArrayContent(body);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json") { CharSet = "utf-8" };
        request.Headers.Add(SignatureHeader, signature);

        try
        {
            using var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
                return true;

            _logger.LogWarning(
                "Ngân hàng giả lập: webhook trả {StatusCode} cho giao dịch {TransactionId}",
                (int)response.StatusCode, notification.TransactionId);
            return false;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                "Ngân hàng giả lập: không kết nối được webhook {WebhookUrl} cho giao dịch {TransactionId} ({Error})",
                _settings.WebhookUrl, notification.TransactionId, ex.Message);
            return false;
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            // Hết HttpClient.Timeout. Webhook có thể đã kịp lưu giao dịch; mã giao dịch không gửi lại nên lần
            // chuyển sau là giao dịch mới, như ngân hàng thật
            _logger.LogWarning(
                "Ngân hàng giả lập: webhook không trả lời trong {Timeout} giây cho giao dịch {TransactionId}",
                _httpClient.Timeout.TotalSeconds, notification.TransactionId);
            return false;
        }
    }
}

// D57: đọc ở Program.cs khi bật Ngân hàng giả lập. SigningKey là byte UTF-8 của BankWebhook:SecretKey, như
// BankWebhookSettings của bộ lọc webhook
public sealed record MockBankSettings(Uri WebhookUrl, byte[] SigningKey);
