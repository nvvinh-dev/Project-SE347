"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation } from "@/hooks/useApiQuery";
import { schoolChildrenKey } from "@/hooks/useSchoolChildren";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { SchoolChild } from "@/types/health";
import { healthHistoryQueryKey } from "../../health-history/_lib/useHealthHistory";
import type { HealthHistoryData } from "../../health-history/_lib/types";

export function useHealthNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useApiMutation<SchoolChild, { childId: string; healthNotes: string }>({
    retry: false,
    networkMode: "always",
    mutationFn: async ({ childId, healthNotes }) => {
      const value = healthNotes.trim();
      if (value.length > 1000) throw new ApiError("Lưu ý sức khỏe không được dài quá 1000 ký tự.", null, 400);
      await queryClient.cancelQueries({ queryKey: schoolChildrenKey(user?.userId) });
      const response = await apiClient.put<ApiResponse<SchoolChild>>(
        `/api/children/${encodeURIComponent(childId)}/health-notes`,
        { healthNotes: value },
        { timeout: 20_000 }
      );
      const envelope = response.data;
      if (!envelope?.success || !envelope.data) {
        throw new ApiError(envelope?.message ?? "Chưa thể lưu lưu ý sức khỏe. Vui lòng thử lại.", envelope?.errors ?? null, response.status);
      }
      const child = envelope.data;
      if (child.id !== childId || typeof child.fullName !== "string" ||
        typeof child.dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(child.dateOfBirth) ||
        !(child.healthNotes === null || typeof child.healthNotes === "string")) {
        throw new ApiError("Phản hồi lưu ý sức khỏe không hợp lệ. Vui lòng kiểm tra lại trước khi lưu tiếp.", null, response.status);
      }
      return child;
    },
    onSuccess: async (child) => {
      // Chặn phản hồi đọc cũ ghi đè kết quả vừa lưu; cập nhật trực tiếp từ máy chủ.
      await queryClient.cancelQueries({ queryKey: schoolChildrenKey(user?.userId) });
      await queryClient.cancelQueries({ queryKey: healthHistoryQueryKey(user?.userId, child.id) });
      queryClient.setQueryData<SchoolChild[]>(schoolChildrenKey(user?.userId),
        (current) => current?.map((item) => item.id === child.id ? child : item));
      queryClient.setQueryData<HealthHistoryData>(healthHistoryQueryKey(user?.userId, child.id),
        (current) => current ? { ...current, child } : undefined);
    },
  });
}
