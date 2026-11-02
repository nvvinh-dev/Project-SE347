import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { CreateWeeklyMenuRequest, UpdateWeeklyMenuRequest, WeeklyMenuResponse } from "@/types/menu";
import { useApiMutation, useApiQuery } from "./useApiQuery";

export const WEEKLY_MENU_QUERY_KEY = ["weekly-menus"] as const;
const menuKey = (userId: string | undefined, week: string) => [...WEEKLY_MENU_QUERY_KEY, userId, week];

function readMenu(response: ApiResponse<WeeklyMenuResponse>, status: number, fallbackMessage: string) {
  if (!response.success || !response.data) {
    throw new ApiError(response.message ?? fallbackMessage, response.errors, status);
  }
  return response.data;
}

export function useWeeklyMenu(weekStartDate: string) {
  const { user } = useAuth();
  return useApiQuery<WeeklyMenuResponse | null>({
    queryKey: menuKey(user?.userId, weekStartDate),
    enabled: !!weekStartDate && (user?.role === "Accountant" || user?.role === "Parent"),
    retry: (count, error) => count < 1 && error.status !== 400 && error.status !== 403 && error.status !== 404,
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get<ApiResponse<WeeklyMenuResponse>>("/api/weekly-menus", {
          params: { weekStartDate }, signal,
        });
        return readMenu(response.data, response.status, "Không thể tải thực đơn tuần.");
      } catch (error) {
        const apiError = toApiError(error);
        // GET theo tuần: 404 là tuần chưa lập thực đơn, không phải lỗi tải trang.
        if (apiError.status === 404) return null;
        throw apiError;
      }
    },
  });
}

export function useCreateWeeklyMenu() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useApiMutation<WeeklyMenuResponse, CreateWeeklyMenuRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<WeeklyMenuResponse>>("/api/weekly-menus", data);
      return readMenu(response.data, response.status, "Không thể tạo thực đơn tuần.");
    },
    onSuccess: (menu) => {
      queryClient.setQueryData(menuKey(user?.userId, menu.weekStartDate), menu);
      return queryClient.invalidateQueries({ queryKey: menuKey(user?.userId, menu.weekStartDate), exact: true });
    },
    onError: (error, data) => {
      if (error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: menuKey(user?.userId, data.weekStartDate), exact: true });
      }
    },
  });
}

export function useUpdateWeeklyMenu() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useApiMutation<WeeklyMenuResponse, { id: string; weekStartDate: string; data: UpdateWeeklyMenuRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ApiResponse<WeeklyMenuResponse>>(`/api/weekly-menus/${id}`, data);
      return readMenu(response.data, response.status, "Không thể cập nhật thực đơn tuần.");
    },
    onSuccess: (menu) => {
      queryClient.setQueryData(menuKey(user?.userId, menu.weekStartDate), menu);
      return queryClient.invalidateQueries({ queryKey: menuKey(user?.userId, menu.weekStartDate), exact: true });
    },
    onError: (error, data) => {
      if (error.status === 404) {
        return queryClient.invalidateQueries({ queryKey: menuKey(user?.userId, data.weekStartDate), exact: true });
      }
    },
  });
}
