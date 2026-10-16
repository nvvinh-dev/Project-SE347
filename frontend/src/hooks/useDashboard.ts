import { apiClient } from "@/lib/axios";
import { useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  OverviewDashboardResponse,
  ChildrenStatisticsResponse,
} from "@/types/dashboard";

export const DASHBOARD_OVERVIEW_KEY = ["dashboard", "overview"] as const;
export const DASHBOARD_CHILDREN_STATS_KEY = ["dashboard", "children-statistics"] as const;

/**
 * Hook truy vấn tổng quan dashboard vận hành (FR-DASH-01, AC-DASH-01)
 * Chỉ dành cho Admin, trả dữ liệu số lượng trẻ, nhân sự và trạng thái các lớp
 */
export function useDashboardOverview() {
  return useApiQuery<OverviewDashboardResponse>({
    queryKey: DASHBOARD_OVERVIEW_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<OverviewDashboardResponse>>(
        "/api/dashboard/overview"
      );
      if (!response.data.data) {
        throw new Error(response.data.message ?? "Không có dữ liệu tổng quan.");
      }
      return response.data.data;
    },
  });
}

/**
 * Hook truy vấn thống kê số lượng trẻ theo tháng hiện tại (FR-DASH-02, AC-DASH-02, D39 mục 12)
 * Trả tổng số trẻ và số trẻ phân bổ theo 3 lớp Mầm, Chồi, Lá
 */
export function useChildrenStatistics() {
  return useApiQuery<ChildrenStatisticsResponse>({
    queryKey: DASHBOARD_CHILDREN_STATS_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ChildrenStatisticsResponse>>(
        "/api/dashboard/children-statistics"
      );
      if (!response.data.data) {
        throw new Error(response.data.message ?? "Không có dữ liệu thống kê số lượng trẻ.");
      }
      return response.data.data;
    },
  });
}
