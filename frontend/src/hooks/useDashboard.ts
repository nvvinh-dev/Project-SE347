import { apiClient } from "@/lib/axios";
import { useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  ChildrenStatisticsResponse,
  AttendanceStatisticsResponse,
  RevenueStatisticsResponse,
} from "@/types/dashboard";

export const DASHBOARD_CHILDREN_STATS_KEY = ["dashboard", "children-statistics"] as const;
export const DASHBOARD_ATTENDANCE_STATS_KEY = ["dashboard", "attendance-statistics"] as const;
export const DASHBOARD_REVENUE_STATS_KEY = ["dashboard", "revenue-statistics"] as const;

/**
 * Hook truy vấn thống kê số lượng trẻ cho Dashboard Admin (FR-DASH-02, AC-DASH-02)
 * Chỉ dành cho Admin, trả dữ liệu số lượng trẻ và cơ cấu phân bổ các khối lớp
 */
export function useChildrenStatistics() {
  return useApiQuery<ChildrenStatisticsResponse>({
    queryKey: DASHBOARD_CHILDREN_STATS_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ChildrenStatisticsResponse>>(
        "/api/dashboard/children-statistics"
      );
      if (!response.data.data) {
        throw new Error(response.data.message ?? "Không có dữ liệu thống kê số trẻ.");
      }
      return response.data.data;
    },
  });
}

/**
 * Hook truy vấn thống kê điểm danh cho Dashboard Admin (FR-DASH-03, AC-DASH-03)
 * Chỉ dành cho Admin, trả tỷ lệ % có mặt tháng hiện tại toàn trường và theo từng khối lớp
 */
export function useAttendanceStatistics() {
  return useApiQuery<AttendanceStatisticsResponse>({
    queryKey: DASHBOARD_ATTENDANCE_STATS_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AttendanceStatisticsResponse>>(
        "/api/dashboard/attendance-statistics"
      );
      if (!response.data.data) {
        throw new Error(response.data.message ?? "Không có dữ liệu thống kê điểm danh.");
      }
      return response.data.data;
    },
  });
}

/**
 * Hook truy vấn thống kê doanh thu học phí cho Dashboard Admin (FR-DASH-04, AC-DASH-04)
 * Chỉ dành cho Admin, trả tổng thu tháng hiện tại và số hóa đơn chưa thanh toán (tổng hợp qua ITuitionService)
 */
export function useRevenueStatistics() {
  return useApiQuery<RevenueStatisticsResponse>({
    queryKey: DASHBOARD_REVENUE_STATS_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RevenueStatisticsResponse>>(
        "/api/dashboard/revenue-statistics"
      );
      if (!response.data.data) {
        throw new Error(response.data.message ?? "Không có dữ liệu thống kê doanh thu.");
      }
      return response.data.data;
    },
  });
}
