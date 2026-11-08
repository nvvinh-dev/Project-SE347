import { useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type {
  InvoiceRequest,
  InvoiceResponse,
  PaymentResponse,
  RecordPaymentRequest,
  TuitionFeeRequest,
  TuitionFeeResponse,
} from "@/types/tuition";
import { useApiMutation, useApiQuery } from "./useApiQuery";

export const TUITION_FEES_QUERY_KEY = ["tuition-fees"] as const;
export const INVOICES_QUERY_KEY = ["invoices"] as const;

function readData<T>(response: ApiResponse<T>, status: number, fallbackMessage: string): T {
  if (!response.success || response.data == null) {
    throw new ApiError(response.message ?? fallbackMessage, response.errors, status);
  }
  return response.data;
}

// D39 mục 4: trường chỉ có một biểu phí, API trả danh sách nên lấy phần tử đầu.
export function useTuitionFee() {
  return useApiQuery<TuitionFeeResponse | null>({
    queryKey: TUITION_FEES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<TuitionFeeResponse[]>>("/api/tuition-fees", { signal });
      return readData(response.data, response.status, "Không thể tải biểu phí.")[0] ?? null;
    },
  });
}

export function useSaveTuitionFee() {
  const queryClient = useQueryClient();
  return useApiMutation<TuitionFeeResponse, { id?: string; data: TuitionFeeRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = id
        ? await apiClient.put<ApiResponse<TuitionFeeResponse>>(`/api/tuition-fees/${id}`, data)
        : await apiClient.post<ApiResponse<TuitionFeeResponse>>("/api/tuition-fees", data);
      return readData(response.data, response.status, "Không thể lưu biểu phí.");
    },
    onSuccess: (fee) => {
      queryClient.setQueryData(TUITION_FEES_QUERY_KEY, fee);
      void queryClient.invalidateQueries({ queryKey: TUITION_FEES_QUERY_KEY, exact: true });
    },
    // 409: trường đã có biểu phí do người khác vừa tạo; 404: biểu phí đang sửa không còn.
    onError: (error) => {
      if (error.status === 409 || error.status === 404) {
        return queryClient.invalidateQueries({ queryKey: TUITION_FEES_QUERY_KEY, exact: true });
      }
    },
  });
}

// Lấy toàn bộ hóa đơn (API sắp mới nhất trước) để lọc trạng thái và tìm kiếm tại chỗ.
export function useInvoices() {
  return useApiQuery<InvoiceResponse[]>({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<InvoiceResponse[]>>("/api/invoices", { signal });
      return readData(response.data, response.status, "Không thể tải danh sách hóa đơn.");
    },
  });
}

export function useSaveInvoice() {
  const queryClient = useQueryClient();
  return useApiMutation<InvoiceResponse, { id?: string; data: InvoiceRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = id
        ? await apiClient.put<ApiResponse<InvoiceResponse>>(`/api/invoices/${id}`, data)
        : await apiClient.post<ApiResponse<InvoiceResponse>>("/api/invoices", data);
      return readData(response.data, response.status, "Không thể lưu hóa đơn.");
    },
    onSuccess: (saved) => {
      // Đưa ngay hóa đơn vừa lưu vào danh sách rồi tải lại ngầm, popup không phải chờ.
      queryClient.setQueryData<InvoiceResponse[]>(INVOICES_QUERY_KEY, (invoices) => invoices && (
        invoices.some((invoice) => invoice.id === saved.id)
          ? invoices.map((invoice) => invoice.id === saved.id ? saved : invoice)
          : [saved, ...invoices]
      ));
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true });
    },
    onError: (error, { id }) => {
      // Sửa: hóa đơn vừa được ghi nhận thu (409) hoặc không còn (404) → tải lại để khóa nút sửa.
      if (id && (error.status === 409 || error.status === 404)) {
        return queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true });
      }
      // Tạo: 409 là chưa có biểu phí.
      if (!id && error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: TUITION_FEES_QUERY_KEY, exact: true });
      }
    },
  });
}

// FR-TUITION-06: ghi nhận một lần, không hoàn tác được (D21).
export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useApiMutation<PaymentResponse, { invoiceId: string; data: RecordPaymentRequest }>({
    mutationFn: async ({ invoiceId, data }) => {
      const response = await apiClient.post<ApiResponse<PaymentResponse>>(
        `/api/invoices/${invoiceId}/record-payment`, data,
      );
      return readData(response.data, response.status, "Không thể ghi nhận thanh toán.");
    },
    onSuccess: (payment) => {
      // Khóa ngay hóa đơn vừa thu trên danh sách, không chờ tải lại.
      queryClient.setQueryData<InvoiceResponse[]>(INVOICES_QUERY_KEY, (invoices) => invoices?.map(
        (invoice) => invoice.id === payment.invoiceId ? { ...invoice, status: "paid" } : invoice,
      ));
      // Không chờ tải lại: hóa đơn đã khóa trên danh sách, popup đóng ngay.
      void queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true });
    },
    onError: (error) => {
      if (error.status === 409 || error.status === 404) {
        return queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true });
      }
    },
  });
}
