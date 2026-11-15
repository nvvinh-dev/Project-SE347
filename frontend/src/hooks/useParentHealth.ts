import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { ParentHealthResponse, ParentIncident, ParentIncidentDetail } from "@/types/health";
import { useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";

export const PARENT_HEALTH_QUERY_KEY = ["parent-health"] as const;

async function getData<T>(path: string, fallbackMessage: string, signal?: AbortSignal): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(path, { signal, timeout: 20_000 });
  if (!response.data.success || response.data.data == null) {
    throw new ApiError(response.data.message ?? fallbackMessage, response.data.errors, response.status);
  }
  return response.data.data;
}

function useChildQuery<T>(path: string, fallbackMessage: string, enabled: boolean, fresh = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiQuery<T>({
    // Tách cache theo phụ huynh và đường dẫn (đã gồm id trẻ), không dùng dữ liệu trẻ trước làm placeholder.
    queryKey: [...PARENT_HEALTH_QUERY_KEY, user?.userId, path],
    enabled: user?.role === "Parent" && enabled,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    // fresh: xóa dữ liệu có URL ảnh ký ngay khi không còn component nào dùng (D53).
    ...(fresh && { gcTime: 0 }),
    queryFn: async ({ signal }) => {
      try {
        return await getData<T>(path, fallbackMessage, signal);
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.status === 404) {
          // Liên kết có thể vừa bị gỡ: làm mới danh sách con rồi trả lỗi để ẩn dữ liệu cũ.
          void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
        }
        throw apiError;
      }
    },
  });
}

export function useParentHealth(childId: string) {
  return useChildQuery<ParentHealthResponse>(
    `/api/children/${childId}/health`, "Không thể tải thông tin sức khỏe. Vui lòng thử lại.", !!childId);
}

export function useParentIncidents(childId: string) {
  return useChildQuery<ParentIncident[]>(
    `/api/children/${childId}/incidents`, "Không thể tải danh sách sự cố. Vui lòng thử lại.", !!childId);
}

/** Chỉ gọi hook này trong component được dựng khi mở ảnh; gỡ component thì gcTime 0 xóa URL cũ. */
export function useParentIncidentDetail(childId: string, incidentId: string) {
  const path = `/api/children/${childId}/incidents/${incidentId}`;
  const query = useChildQuery<ParentIncidentDetail>(path, "Không thể tải ảnh của sự cố. Vui lòng thử lại.", true, true);

  // URL hết hạn → xin lại qua route chi tiết; ảnh cùng hết hạn thì dùng chung một request.
  const getFreshPhotoUrl = async (photoId: string) => {
    let pending = inFlight.get(path);
    if (!pending) {
      pending = getData<ParentIncidentDetail>(path, "Không thể làm mới liên kết ảnh.")
        .finally(() => inFlight.delete(path));
      inFlight.set(path, pending);
    }
    const url = (await pending).photos.find((photo) => photo.id === photoId)?.url;
    if (!url) throw new Error("Không tìm thấy liên kết mới cho ảnh này.");
    return url;
  };

  return { ...query, getFreshPhotoUrl };
}

const inFlight = new Map<string, Promise<ParentIncidentDetail>>();
