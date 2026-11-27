using System.Security.Cryptography;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.MockBank;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;

namespace NhaTre.Application.Services;

// D57: đóng vai app ngân hàng của phụ huynh kiêm dịch vụ theo dõi tài khoản của trường. Server tự sinh mã
// giao dịch và thời điểm (phụ huynh không chọn được), tài khoản nhận luôn là PaymentAccount. Kết quả đối soát
// do webhook và TuitionService quyết, service này không biết
public class MockBankService : IMockBankService
{
    private const string TransactionIdPrefix = "MOCK";

    private readonly IMockBankWebhookClient _webhookClient;
    private readonly PaymentAccountSettings _paymentAccount;

    public MockBankService(IMockBankWebhookClient webhookClient, PaymentAccountSettings paymentAccount)
    {
        _webhookClient = webhookClient;
        _paymentAccount = paymentAccount;
    }

    public async Task<MockBankTransferResult> TransferAsync(MockBankTransferRequest request)
    {
        var transactionAtUtc = DateTime.UtcNow;
        var notification = new BankTransactionNotification(
            TransactionId: NewTransactionId(transactionAtUtc),
            AccountNumber: _paymentAccount.AccountNumber,
            Amount: request.Amount,
            Content: request.Content.Trim(),
            TransactionAtUtc: transactionAtUtc);

        if (!await _webhookClient.SendAsync(notification))
            return new MockBankTransferResult(MockBankTransferOutcome.WebhookFailed);

        return new MockBankTransferResult(
            MockBankTransferOutcome.Delivered,
            new MockBankReceipt(notification.TransactionId, notification.Amount, notification.Content, notification.TransactionAtUtc));
    }

    // "MOCK" + thời điểm đến giây + 8 ký tự hex ngẫu nhiên, ví dụ MOCK20261123091530A1B2C3D4 (26 ký tự, cột
    // transaction_id tối đa 100). Phần ngẫu nhiên tránh trùng khi hai phụ huynh chuyển trong cùng một giây:
    // webhook coi transactionId đã có là ngân hàng gửi lại và không lưu thêm
    private static string NewTransactionId(DateTime transactionAtUtc)
        => $"{TransactionIdPrefix}{transactionAtUtc:yyyyMMddHHmmss}{RandomNumberGenerator.GetHexString(8)}";
}
