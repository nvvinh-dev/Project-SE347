import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { ChildComplaintResponse, CreateComplaintRequest } from "@/types/complaints";
import { useApiMutation, useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";

export const CHILD_COMPLAINTS_QUERY_KEY = ["child-complaints"] as const;

function readData<T>(response: ApiResponse<T>, status: number, fallbackMessage: string): T {
  if (!response.success || response.data == null) {
    throw new ApiError(response.message ?? fallbackMessage, response.errors, status);
  }
  return response.data;
}

// FR-COMPLAINT-01: mọi phản ánh của con, kể cả do phụ huynh khác của trẻ gửi; API đã sắp mới nhất
// trước và không phân trang.
export function useChildComplaints(childId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiQuery<ChildComplaintResponse[]>({
    // Tách cache theo phụ huynh và trẻ; không dùng dữ liệu trẻ trước làm placeholder.
    queryKey: [...CHILD_COMPLAINTS_QUERY_KEY, user?.userId, childId],
    enabled: user?.role === "Parent" && !!childId,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get<ApiResponse<ChildComplaintResponse[]>>(
          `/api/children/${childId}/complaints`, { signal },
        );
        return readData(response.data, response.status, "Không thể tải danh sách phản ánh. Vui lòng thử lại.");
      } catch (error) {
        const apiError = toApiError(error);
        // Trẻ không còn liên kết: làm mới danh sách con để bỏ trẻ đó khỏi ô chọn.
        if (apiError.status === 404) {
          void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
        }
        throw apiError;
      }
    },
  });
}

// Gửi xong không sửa, không xóa được (D39 mục 18).
export function useCreateComplaint() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiMutation<ChildComplaintResponse, { childId: string; data: CreateComplaintRequest }>({
    mutationFn: async ({ childId, data }) => {
      const response = await apiClient.post<ApiResponse<ChildComplaintResponse>>(
        `/api/children/${childId}/complaints`, data,
      );
      return readData(response.data, response.status, "Không thể gửi phản ánh. Vui lòng thử lại.");
    },
    onSuccess: (complaint, { childId }) => {
      const key = [...CHILD_COMPLAINTS_QUERY_KEY, user?.userId, childId];
      // Đưa ngay phản ánh vừa gửi lên đầu danh sách, rồi tải lại ngầm.
      queryClient.setQueryData<ChildComplaintResponse[]>(key, (list) => list && [complaint, ...list]);
      void queryClient.invalidateQueries({ queryKey: key, exact: true });
    },
    onError: (error) => {
      if (error.status === 404) {
        return queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
      }
    },
  });
}
