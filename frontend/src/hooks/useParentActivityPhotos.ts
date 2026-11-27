import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { ParentActivityPhotoPage } from "@/types/media";
import { useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";

export const PARENT_PHOTOS_QUERY_KEY = ["parent-activity-photos"] as const;
/** 12 chia hết cho 2, 3 và 4 cột nên lưới luôn đầy hàng ở mọi cỡ màn hình. */
export const PARENT_PHOTOS_PAGE_SIZE = 12;

async function getPage(childId: string, page: number, signal?: AbortSignal): Promise<ParentActivityPhotoPage> {
  const response = await apiClient.get<ApiResponse<ParentActivityPhotoPage>>(
    `/api/children/${childId}/activity-photos`,
    { params: { page, pageSize: PARENT_PHOTOS_PAGE_SIZE }, signal, timeout: 20_000 },
  );
  const data = response.data.data;
  if (!response.data.success || !data || !Array.isArray(data.items)) {
    throw new ApiError(
      response.data.message ?? "Không thể tải ảnh hoạt động. Vui lòng thử lại.",
      response.data.errors,
      response.status,
    );
  }
  return data;
}

// Đang chờ xin lại URL của cùng một trang: nhiều ảnh hết hạn cùng lúc dùng chung một request.
const inFlight = new Map<string, Promise<ParentActivityPhotoPage>>();

export function useParentActivityPhotos(childId: string, page: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useApiQuery<ParentActivityPhotoPage>({
    queryKey: [...PARENT_PHOTOS_QUERY_KEY, user?.userId, childId, page],
    enabled: user?.role === "Parent" && !!childId,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    // D53: không giữ URL ký trong cache; trang không còn được xem là bị xóa ngay, xem lại thì xin URL mới.
    gcTime: 0,
    // Giữ trang cũ (đã xin ở lần xem hiện tại) để lưới không nhảy khi chuyển trang.
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      try {
        return await getPage(childId, page, signal);
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.status === 404) {
          // Liên kết có thể vừa bị gỡ: làm mới danh sách con rồi trả lỗi để ẩn ảnh cũ.
          void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
        }
        throw apiError;
      }
    },
  });

  /** URL hết hạn → gọi lại đúng trang đang xem để lấy URL mới của ảnh đó. */
  const getFreshPhotoUrl = async (photoId: string) => {
    const key = `${childId}:${page}`;
    let pending = inFlight.get(key);
    if (!pending) {
      pending = getPage(childId, page).finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }
    const url = (await pending).items.find((photo) => photo.id === photoId)?.url;
    if (!url) throw new Error("Không tìm thấy liên kết mới cho ảnh này.");
    return url;
  };

  return { ...query, getFreshPhotoUrl };
}
