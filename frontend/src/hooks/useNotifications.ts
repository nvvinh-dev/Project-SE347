import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { SchoolClosureRequest, SchoolClosureResponse } from "@/types/notifications";
import { useApiMutation } from "./useApiQuery";

// FR-NOTI-03: thông báo đã gửi không sửa, không thu hồi được và Kế toán không có danh sách đã gửi,
// nên không có query nào cần làm mới sau khi gửi.
export function useBroadcastSchoolClosure() {
  return useApiMutation<SchoolClosureResponse, SchoolClosureRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<SchoolClosureResponse>>(
        "/api/notifications/school-closures", data,
      );
      if (!response.data.success || !response.data.data) {
        throw new ApiError(response.data.message ?? "Không thể gửi thông báo nghỉ học.", response.data.errors, response.status);
      }
      return response.data.data;
    },
  });
}
