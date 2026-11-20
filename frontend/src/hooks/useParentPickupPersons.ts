"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { PickupPersonInput, PickupPersonResponse, PickupPriority } from "@/types/pickup";
import { useApiMutation, useApiQuery } from "./useApiQuery";
import { MY_CHILDREN_QUERY_KEY } from "./useMyChildren";

export const PARENT_PICKUP_QUERY_KEY = ["parent-pickup-persons"] as const;

const base = (childId: string) => `/api/children/${encodeURIComponent(childId)}/pickup-persons`;

function readData<T>(response: ApiResponse<T>, status: number, fallback: string): T {
  if (!response.success || response.data == null) {
    throw new ApiError(response.message ?? fallback, response.errors, status);
  }
  return response.data;
}

// POST/PUT là multipart: 4 thông tin, consentConfirmed và ảnh ở trường facePhoto (D24).
function toFormData(input: PickupPersonInput, priority?: PickupPriority): FormData {
  const body = new FormData();
  if (priority) body.append("priority", String(priority));
  body.append("fullName", input.fullName.trim());
  body.append("relationship", input.relationship.trim());
  body.append("phoneNumber", input.phoneNumber.trim());
  body.append("citizenIdNumber", input.citizenIdNumber.trim());
  body.append("consentConfirmed", "true");
  if (input.facePhoto) body.append("facePhoto", input.facePhoto);
  return body;
}

// Để trình duyệt tự tạo boundary multipart thay vì kế thừa Content-Type JSON của client chung.
const MULTIPART = { headers: { "Content-Type": undefined }, timeout: 30_000 } as const;

/** Người đón chính (priority 1) đứng trước, người dự phòng sau; trẻ chưa có ai → danh sách rỗng. */
export function useParentPickupPersons(childId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useApiQuery<PickupPersonResponse[]>({
    queryKey: [...PARENT_PICKUP_QUERY_KEY, user?.userId, childId],
    enabled: user?.role === "Parent" && !!childId,
    retry: (count, error) => count < 1 && error.status !== 403 && error.status !== 404,
    // D53: không giữ URL ký trong cache; rời màn hình thì xóa, quay lại sẽ xin URL mới.
    gcTime: 0,
    queryFn: async ({ signal }) => {
      try {
        const response = await apiClient.get<ApiResponse<PickupPersonResponse[]>>(base(childId), { signal });
        return readData(response.data, response.status, "Không thể tải thông tin người đón. Vui lòng thử lại.");
      } catch (error) {
        const apiError = toApiError(error);
        // Liên kết có thể vừa bị gỡ: làm mới danh sách con để bỏ trẻ đó khỏi ô chọn.
        if (apiError.status === 404) {
          void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
        }
        throw apiError;
      }
    },
  });
}

/** URL ảnh hết hạn → xin lại qua API của đúng người đón đó (D53). */
export async function fetchFreshFaceUrl(childId: string, personId: string): Promise<string> {
  const response = await apiClient.get<ApiResponse<PickupPersonResponse>>(
    `${base(childId)}/${encodeURIComponent(personId)}`,
  );
  return readData(response.data, response.status, "Không thể tải lại ảnh khuôn mặt.").facePhotoUrl;
}

function useRefreshAfterWrite(childId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listKey = [...PARENT_PICKUP_QUERY_KEY, user?.userId, childId];

  return {
    ok: () => queryClient.invalidateQueries({ queryKey: listKey, exact: true }),
    // 404: trẻ vừa bị gỡ liên kết. 409: danh sách đã đổi (người khác thêm/xóa) nên tải lại cho khớp.
    fail: (error: ApiError) => {
      if (error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: [...MY_CHILDREN_QUERY_KEY, user?.userId], exact: true });
      }
      if (error.status === 409 || error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: listKey, exact: true });
      }
    },
  };
}

/** Thêm mới (có `priority`) hoặc sửa (có `personId`). Mỗi lần lưu phải kèm ô đồng ý đã đánh dấu (D24). */
export function useSavePickupPerson(childId: string) {
  const refresh = useRefreshAfterWrite(childId);

  return useApiMutation<PickupPersonResponse, { personId?: string; priority?: PickupPriority; input: PickupPersonInput }>({
    mutationFn: async ({ personId, priority, input }) => {
      const response = personId
        ? await apiClient.put<ApiResponse<PickupPersonResponse>>(
          `${base(childId)}/${encodeURIComponent(personId)}`, toFormData(input), MULTIPART)
        : await apiClient.post<ApiResponse<PickupPersonResponse>>(base(childId), toFormData(input, priority), MULTIPART);
      return readData(response.data, response.status, "Không thể lưu thông tin người đón. Vui lòng thử lại.");
    },
    onSuccess: () => refresh.ok(),
    onError: refresh.fail,
  });
}

/** Chỉ xóa được người dự phòng; backend từ chối người đón chính (D40 mục 1). */
export function useDeletePickupPerson(childId: string) {
  const refresh = useRefreshAfterWrite(childId);

  return useApiMutation<void, string>({
    mutationFn: async (personId) => {
      const response = await apiClient.delete<ApiResponse<null>>(`${base(childId)}/${encodeURIComponent(personId)}`);
      if (!response.data.success) {
        throw new ApiError(response.data.message ?? "Không thể xóa người đón dự phòng.", response.data.errors, response.status);
      }
    },
    onSuccess: () => refresh.ok(),
    onError: refresh.fail,
  });
}
