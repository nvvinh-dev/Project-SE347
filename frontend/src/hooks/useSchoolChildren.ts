"use client";

import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { SchoolChild } from "@/types/health";

// Mọi màn hình Y tế dùng cùng key; tách tài khoản để không dùng lại dữ liệu của phiên khác.
export const schoolChildrenKey = (userId: string | undefined) => [
  "medical-school-children", userId,
];

async function getSchoolChildren(signal?: AbortSignal): Promise<SchoolChild[]> {
  const response = await apiClient.get<ApiResponse<SchoolChild[]>>(
    "/api/school-children",
    { signal, timeout: 20_000 }
  );
  const envelope = response.data;
  if (!envelope || envelope.success !== true || envelope.data == null) {
    throw new ApiError(
      envelope?.message ?? "Không thể đọc dữ liệu từ máy chủ. Vui lòng thử lại.",
      envelope?.errors ?? null,
      response.status
    );
  }
  const children = envelope.data;
  if (!Array.isArray(children) || !children.every((child) => child &&
    typeof child.id === "string" && Boolean(child.id) && typeof child.fullName === "string" &&
    typeof child.dateOfBirth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(child.dateOfBirth) &&
    (child.healthNotes === null || typeof child.healthNotes === "string"))) {
    throw new ApiError("Dữ liệu phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại dữ liệu.", null, response.status);
  }
  return children;
}

export function useSchoolChildren() {
  const { user } = useAuth();
  return useApiQuery<SchoolChild[]>({
    queryKey: schoolChildrenKey(user?.userId),
    queryFn: ({ signal }) => getSchoolChildren(signal),
    enabled: Boolean(user?.userId),
    networkMode: "always",
    retry: false,
    staleTime: 60_000,
  });
}
