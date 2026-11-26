"use client";

import { apiClient, ApiError } from "@/lib/axios";
import { useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type { AbsenceEscalationResponse } from "@/types/attendance";

export const ABSENCE_ESCALATIONS_QUERY_KEY = ["absence-escalations", "today"] as const;

/**
 * Hook truy vấn danh sách trẻ vắng không phép cần xử lý hôm nay cho Admin (FR-ATT-04, D39 mục 20, D40 mục 3, D45)
 * Endpoint: GET /api/absence-escalations/today
 */
export function useAbsenceEscalations() {
  return useApiQuery<AbsenceEscalationResponse[]>({
    queryKey: ABSENCE_ESCALATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AbsenceEscalationResponse[]>>(
        "/api/absence-escalations/today"
      );

      if (!response.data.success || !response.data.data) {
        throw new ApiError(
          response.data.message ?? "Không thể tải danh sách trẻ vắng không phép cần xử lý.",
          response.data.errors,
          response.status
        );
      }

      return response.data.data;
    },
  });
}
