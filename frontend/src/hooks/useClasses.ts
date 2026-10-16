import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useApiQuery, useApiMutation } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  ClassResponse,
  ClassPlacementResponse,
  AssignClassRequest,
  AssignHomeroomTeacherRequest,
} from "@/types/class";

export const CLASSES_QUERY_KEY = ["classes"] as const;
export const CLASS_PLACEMENTS_QUERY_KEY = ["class-placements"] as const;

/**
 * Lấy danh sách 3 lớp học cố định (GET /api/classes)
 */
export function useClasses() {
  return useApiQuery<ClassResponse[]>({
    queryKey: CLASSES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ClassResponse[]>>("/api/classes");
      return response.data.data ?? [];
    },
  });
}

/**
 * Lấy danh sách trẻ cần xếp lớp (GET /api/class-placements)
 */
export function useClassPlacements() {
  return useApiQuery<ClassPlacementResponse[]>({
    queryKey: CLASS_PLACEMENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ClassPlacementResponse[]>>("/api/class-placements");
      return response.data.data ?? [];
    },
  });
}

/**
 * Xếp trẻ vào lớp hoặc gỡ khỏi lớp (PUT /api/class-placements/{childId})
 */
export function useAssignClass() {
  const queryClient = useQueryClient();
  return useApiMutation<ClassPlacementResponse, { childId: string; data: AssignClassRequest }>({
    mutationFn: async ({ childId, data }) => {
      const response = await apiClient.put<ApiResponse<ClassPlacementResponse>>(
        `/api/class-placements/${childId}`,
        data
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASS_PLACEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    },
  });
}

/**
 * Phân công hoặc gỡ giáo viên chủ nhiệm (PUT /api/classes/{id}/homeroom-teacher)
 */
export function useAssignHomeroomTeacher() {
  const queryClient = useQueryClient();
  return useApiMutation<ClassResponse, { classId: string; data: AssignHomeroomTeacherRequest }>({
    mutationFn: async ({ classId, data }) => {
      const response = await apiClient.put<ApiResponse<ClassResponse>>(
        `/api/classes/${classId}/homeroom-teacher`,
        data
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    },
  });
}
