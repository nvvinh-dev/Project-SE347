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

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: "Tiền mặt",
  BankTransfer: "Chuyển khoản",
};
