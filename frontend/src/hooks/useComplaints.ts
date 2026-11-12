"use client";

import { useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/axios";
import { useApiQuery, useApiMutation } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  ComplaintListQuery,
  ComplaintPageResponse,
  ComplaintResponse,
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
