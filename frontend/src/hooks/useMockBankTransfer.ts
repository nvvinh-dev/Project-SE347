import { useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { MockBankReceipt, MockBankTransferRequest } from "@/types/tuition";
import { useApiMutation } from "./useApiQuery";
import { PARENT_INVOICES_QUERY_KEY } from "./useParentInvoices";

// D57: backend ký body rồi gọi webhook; webhook không trả 2xx thì trả 502 (coi như chưa chuyển).
export function useMockBankTransfer() {
  const queryClient = useQueryClient();

  return useApiMutation<MockBankReceipt, MockBankTransferRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<MockBankReceipt>>("/api/mock-bank/transfers", data, { timeout: 20_000 });
      if (!response.data.success || response.data.data == null) {
        throw new ApiError(response.data.message ?? "Không thể thực hiện chuyển khoản.", response.data.errors, response.status);
      }
      return response.data.data;
    },
    // Webhook có thể vừa gạch nợ hóa đơn, nên làm mới danh sách hóa đơn của phụ huynh.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PARENT_INVOICES_QUERY_KEY }),
  });
}
