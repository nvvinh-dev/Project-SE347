"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import { useApiQuery, useApiMutation } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";
import type { ApiResponse } from "@/types/auth";
import type {
  ChildComplaintResponse,
  ComplaintListQuery,
  ComplaintPageResponse,
  ComplaintResponse,
  CreateComplaintRequest,
  HandleComplaintRequest,
} from "@/types/complaint";

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;

export function complaintsKey(query?: ComplaintListQuery) {
  return [
    ...COMPLAINTS_QUERY_KEY,
    query?.status ?? "all",
    query?.page ?? 1,
    query?.pageSize ?? 10,
  ] as const;
}

/**
 * Hook truy vấn danh sách phản ánh phụ huynh cho Ban Giám Hiệu (FR-COMPLAINT-02, D40 mục 3, D45)
 */
export function useComplaints(query?: ComplaintListQuery) {
  return useApiQuery<ComplaintPageResponse>({
    queryKey: complaintsKey(query),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ComplaintPageResponse>>("/api/complaints", {
        params: {
          status: query?.status,
          page: query?.page ?? 1,
          pageSize: query?.pageSize ?? 10,
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new ApiError(
          response.data.message ?? "Không thể tải danh sách phản ánh.",
          response.data.errors,
          response.status
        );
      }

      return response.data.data;
    },
  });
}

/**
 * Hook cập nhật kết quả xử lý phản ánh (FR-COMPLAINT-02)
 * Gọi PUT /api/complaints/{id}/handling và tự động invalidate cache
 */
export function useUpdateComplaintHandling() {
  const queryClient = useQueryClient();

  return useApiMutation<ComplaintResponse, { id: string; data: HandleComplaintRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ApiResponse<ComplaintResponse>>(
        `/api/complaints/${id}/handling`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new ApiError(
          response.data.message ?? "Không thể cập nhật xử lý phản ánh.",
          response.data.errors,
          response.status
        );
      }

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
    },
    onError: (err) => {
      // Khi gặp 409 Conflict (đã được người khác xử lý xong trước), invalidate để refresh bảng
      if (err.status === 409) {
        queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
      }
    },
  });
}

// ===== Phụ huynh (FR-COMPLAINT-01) =====

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
