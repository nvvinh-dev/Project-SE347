import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError } from "@/lib/axios";
import type { ChildAttendanceResponse } from "@/types/attendance";
import type { ApiResponse } from "@/types/auth";
import { useApiQuery } from "./useApiQuery";

export const PARENT_ATTENDANCE_QUERY_KEY = ["parent-attendances"] as const;

export function useParentAttendance(childId: string) {
  const { user } = useAuth();

  return useApiQuery<ChildAttendanceResponse[]>({
    // Tách cache theo phụ huynh và trẻ; không dùng dữ liệu trẻ trước làm placeholder.
    queryKey: [...PARENT_ATTENDANCE_QUERY_KEY, user?.userId, childId],
    enabled: user?.role === "Parent" && !!childId,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    queryFn: async ({ signal }) => {
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
    },
  });
}
