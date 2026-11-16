import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";

export interface HomeroomClass { id: string; name: string }
export interface SharedPhoto { id: string; uploadedAtUtc: string; url: string }

const isText = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export async function getHomeroomClasses(signal?: AbortSignal): Promise<HomeroomClass[]> {
  const response = await apiClient.get<ApiResponse<HomeroomClass[]>>("/api/homeroom-classes", { signal });
  const data = response.data?.data;
  if (!response.data?.success || !Array.isArray(data) ||
    !data.every((item: unknown) => isObject(item) && isText(item.id) && isText(item.name))) {
    throw new ApiError(response.data?.message || "Không đọc được danh sách lớp. Vui lòng tải lại.", null, response.status);
  }
  return data;
}

export async function shareActivityPhotos(classId: string, files: File[]): Promise<SharedPhoto[]> {
  const body = new FormData();
  files.forEach((file) => body.append("photos", file));
  const response = await apiClient.post<ApiResponse<SharedPhoto[]>>(
    `/api/classes/${encodeURIComponent(classId)}/activity-photos`,
    body,
    // Để trình duyệt tự tạo boundary multipart thay vì kế thừa Content-Type JSON của client chung.
    { headers: { "Content-Type": undefined } },
  );
  const data = response.data?.data;
  if (!response.data?.success || !Array.isArray(data) || data.length !== files.length ||
    !data.every((item: unknown) => isObject(item) && isText(item.id) && isText(item.url) &&
      isText(item.uploadedAtUtc) && Number.isFinite(Date.parse(item.uploadedAtUtc)))) {
    // Phản hồi không khớp số ảnh đã gửi thì chưa khẳng định được kết quả; status null để xử lý như mất kết nối.
    throw new ApiError("Chưa xác định được kết quả chia sẻ.", null, null);
  }
  return data;
}
