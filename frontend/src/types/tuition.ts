// Phản chiếu DTO trong NhaTre.Application/DTOs/Tuition.

export type InvoiceStatus = "unpaid" | "paid";
export type PaymentMethod = "Cash" | "BankTransfer";

export interface TuitionFeeResponse {
  id: string;
  description: string;
  amount: number;
}

export interface TuitionFeeRequest {
  description: string;
  amount: number;
}

export interface InvoiceResponse {
  id: string;
  childId: string;
  childFullName: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  issuedAtUtc: string;
  // FR-TUITION-07: mã chuyển khoản do server sinh (D21 mục 1); thiếu khi backend chưa có trường này.
  paymentCode?: string | null;
}

// Không có status: hóa đơn mới luôn unpaid do server đặt (BR-TUITION-09).
export interface InvoiceRequest {
  childId: string;
  amount: number;
  description: string;
}

// Số tiền, thời điểm và người ghi nhận do server đặt (BR-TUITION-11).
export interface RecordPaymentRequest {
  paymentMethod: PaymentMethod;
  externalReference: string | null;
}

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  externalReference: string | null;
  paidAtUtc: string;
}

// FR-TUITION-05: phụ huynh xem hóa đơn của con; không kèm id/họ tên trẻ (D45). Mới lập trước.
export interface ChildInvoiceResponse {
  id: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  issuedAtUtc: string;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Tiền mặt",
  BankTransfer: "Chuyển khoản",
};

// Kỳ báo cáo là tháng hiện tại giờ Việt Nam: [periodStartUtc, periodEndUtc). Hiển thị kỳ bằng year/month.
export interface RevenueReportResponse {
  year: number;
  month: number;
  periodStartUtc: string;
  periodEndUtc: string;
  generatedAtUtc: string;
  totalCollected: number;
  unpaidInvoiceCount: number;
}

// FR-TUITION-09: giao dịch ngân hàng của tài khoản trường (D21 mục 2, 3; D45).
export type BankTransactionStatus = "Matched" | "Unmatched" | "Dismissed";
export type UnmatchedReason = "NoInvoiceCode" | "AmbiguousInvoiceCode" | "AmountMismatch" | "InvoiceAlreadyPaid";

export interface BankTransactionResponse {
  id: string;
  transactionId: string;
  amount: number;
  content: string;
  transactionAtUtc: string;
  status: BankTransactionStatus;
  // Giữ lý do ban đầu kể cả khi đã được gán hoặc bỏ qua.
  unmatchedReason: UnmatchedReason | null;
  resolutionNote: string | null;
  resolvedAtUtc: string | null;
  // Chỉ có khi giao dịch đã khớp: hóa đơn nối với giao dịch.
  invoiceId?: string | null;
  invoicePaymentCode?: string | null;
  invoiceDescription?: string | null;
  invoiceChildFullName?: string | null;
}

export interface DismissBankTransactionRequest {
  note: string;
}

export const BANK_TRANSACTION_STATUS_LABELS: Record<BankTransactionStatus, string> = {
  Unmatched: "Chưa khớp",
  Matched: "Đã khớp",
  Dismissed: "Đã bỏ qua",
};

export const UNMATCHED_REASON_LABELS: Record<UnmatchedReason, string> = {
  NoInvoiceCode: "Nội dung không có mã thanh toán",
  AmbiguousInvoiceCode: "Nội dung có nhiều mã thanh toán",
  AmountMismatch: "Số tiền lệch so với hóa đơn",
  InvoiceAlreadyPaid: "Hóa đơn đã được thanh toán",
};

// FR-TUITION-07: thông tin chuyển khoản của một hóa đơn unpaid (D45); không kèm id hay họ tên trẻ.
// transferContent là mã thanh toán của hóa đơn; qrImageUrl thuộc img.vietqr.io.
export interface PaymentInstructionResponse {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrImageUrl: string;
}

// D57: Ngân hàng giả lập; tài khoản nhận luôn là tài khoản của trường nên không có trong request.
export interface MockBankTransferRequest {
  amount: number;
  content: string;
}

// Biên lai không kèm kết quả đối soát vì ngân hàng không biết hóa đơn (D57).
export interface MockBankReceipt {
  transactionId: string;
  amount: number;
  content: string;
  transactionAtUtc: string;
}
