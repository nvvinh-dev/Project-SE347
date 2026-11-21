import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { PaymentInstructionResponse } from "@/types/tuition";
import { useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";
import { PARENT_INVOICES_QUERY_KEY } from "./useParentInvoices";

// FR-TUITION-07: chỉ gọi khi phụ huynh mở hộp thoại chuyển khoản của một hóa đơn chưa thanh toán.
export function useParentPaymentInstruction(childId: string, invoiceId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiQuery<PaymentInstructionResponse>({
    queryKey: ["parent-payment-instruction", user?.userId, childId, invoiceId],
    enabled: user?.role === "Parent" && !!childId && !!invoiceId,
    // Số tiền hóa đơn có thể vừa được sửa: mỗi lần mở hộp thoại lấy lại, không dùng bản cũ.
    gcTime: 0,
    retry: (count, error) => count < 1 && (error.status === null || error.status >= 500),
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get<ApiResponse<PaymentInstructionResponse>>(
          `/api/children/${childId}/invoices/${invoiceId}/payment-instruction`,
          { signal, timeout: 20_000 },
        );
        if (!response.data.success || response.data.data == null) {
          throw new ApiError(
            response.data.message ?? "Không thể tải thông tin chuyển khoản. Vui lòng thử lại.",
            response.data.errors,
            response.status,
          );
        }
        return response.data.data;
      } catch (error) {
        const apiError = toApiError(error);
        // 409: hóa đơn đã được gạch nợ; 404: mất quyền xem. Làm mới danh sách để hiện trạng thái thật.
        if (apiError.status === 409) {
          void queryClient.invalidateQueries({ queryKey: [...PARENT_INVOICES_QUERY_KEY, user?.userId, childId], exact: true });
        } else if (apiError.status === 404) {
          void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
        }
        throw apiError;
      }
    },
  });
}
