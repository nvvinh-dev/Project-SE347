import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ChildAttendanceResponse } from "@/types/attendance";
import type { ApiResponse } from "@/types/auth";
import { useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";

export const PARENT_ATTENDANCE_QUERY_KEY = ["parent-attendances"] as const;

export function useParentAttendance(childId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiQuery<ChildAttendanceResponse[]>({
    // Tách cache theo phụ huynh và trẻ; không dùng dữ liệu trẻ trước làm placeholder.
    queryKey: [...PARENT_ATTENDANCE_QUERY_KEY, user?.userId, childId],
    enabled: user?.role === "Parent" && !!childId,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get<ApiResponse<ChildAttendanceResponse[]>>(
          `/api/children/${childId}/attendances`,
          { signal },
        );
        if (!response.data.success) {
          throw new ApiError(
            response.data.message ?? "Không thể tải lịch sử điểm danh. Vui lòng thử lại.",
            response.data.errors,
            response.status,
          );
        }
        return response.data.data ?? [];
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.status === 404) {
          // Làm mới danh sách con, đồng thời trả lỗi ngay để ẩn dữ liệu cũ khi mất quyền xem.
          void queryClient.invalidateQueries({
            queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId],
            exact: true,
          });
        }
        throw apiError;
      }
    },
  });
}
