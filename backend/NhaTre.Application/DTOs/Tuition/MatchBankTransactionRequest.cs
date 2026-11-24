namespace NhaTre.Application.DTOs.Tuition;

// Chỉ có hóa đơn cần gán. Người và thời điểm xử lý do server đặt (D44 mục 2)
public record MatchBankTransactionRequest(Guid InvoiceId);
