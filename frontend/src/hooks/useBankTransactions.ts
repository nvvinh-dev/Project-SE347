import { useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { BankTransactionResponse, DismissBankTransactionRequest } from "@/types/tuition";
import { INVOICES_QUERY_KEY, REVENUE_REPORT_QUERY_KEY } from "./useTuition";
import { useApiMutation, useApiQuery } from "./useApiQuery";

export const BANK_TRANSACTIONS_QUERY_KEY = ["bank-transactions"] as const;

function assertOk(response: ApiResponse<unknown>, status: number, fallbackMessage: string) {
  if (!response.success) throw new ApiError(response.message ?? fallbackMessage, response.errors, status);
}

// Lấy toàn bộ giao dịch (API sắp mới nhất trước) để lọc trạng thái và đếm số lượng tại chỗ.
export function useBankTransactions() {
  return useApiQuery<BankTransactionResponse[]>({
    queryKey: BANK_TRANSACTIONS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<BankTransactionResponse[]>>("/api/bank-transactions", { signal });
      if (!response.data.success || response.data.data == null) {
        throw new ApiError(response.data.message ?? "Không thể tải danh sách giao dịch.", response.data.errors, response.status);
      }
      return response.data.data;
    },
  });
}

// 409: giao dịch/hóa đơn vừa được xử lý ở nơi khác; 404: không còn → tải lại để thấy trạng thái thật.
function useRefreshOnConflict() {
  const queryClient = useQueryClient();
  return (error: ApiError) => {
    if (error.status === 409 || error.status === 404) {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: BANK_TRANSACTIONS_QUERY_KEY, exact: true }),
        queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true }),
      ]);
    }
  };
}

// Gán chuyển hóa đơn sang paid và tạo thanh toán (D21 mục 3) nên làm mới cả hóa đơn và báo cáo doanh thu.
export function useMatchBankTransaction() {
  const queryClient = useQueryClient();
  const refreshOnConflict = useRefreshOnConflict();
  return useApiMutation<void, { id: string; invoiceId: string }>({
    mutationFn: async ({ id, invoiceId }) => {
      const response = await apiClient.post<ApiResponse<unknown>>(`/api/bank-transactions/${id}/match`, { invoiceId });
      assertOk(response.data, response.status, "Không thể gán giao dịch vào hóa đơn.");
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: BANK_TRANSACTIONS_QUERY_KEY, exact: true }),
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY, exact: true }),
      queryClient.invalidateQueries({ queryKey: REVENUE_REPORT_QUERY_KEY, exact: true }),
    ]),
    onError: refreshOnConflict,
  });
}

export function useDismissBankTransaction() {
  const queryClient = useQueryClient();
  const refreshOnConflict = useRefreshOnConflict();
  return useApiMutation<void, { id: string; data: DismissBankTransactionRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.post<ApiResponse<unknown>>(`/api/bank-transactions/${id}/dismiss`, data);
      assertOk(response.data, response.status, "Không thể đánh dấu giao dịch.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_TRANSACTIONS_QUERY_KEY, exact: true }),
    onError: refreshOnConflict,
  });
}
