import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { MyChildResponse } from "@/types/children";
import { useApiQuery } from "./useApiQuery";

export const MY_CHILDREN_QUERY_KEY = ["my-children"] as const;

export function useMyChildren() {
  const { user } = useAuth();

  return useApiQuery<MyChildResponse[]>({
    queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId],
    enabled: user?.role === "Parent",
    retry: (count, error) => count < 1 && error.status !== 403,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<MyChildResponse[]>>(
        "/api/children/mine",
        { signal },
      );
      if (!response.data.success) {
        throw new ApiError(
          response.data.message ?? "Không thể tải danh sách con. Vui lòng thử lại.",
          response.data.errors,
          response.status,
        );
      }
      return response.data.data ?? [];
    },
  });
}
