import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { CreateTeacherRequest, TeacherAccountResponse, TeacherResponse } from "@/types/teachers";
import { useApiMutation, useApiQuery } from "./useApiQuery";

export const TEACHERS_QUERY_KEY = ["teachers"] as const;
export const TEACHER_ACCOUNTS_QUERY_KEY = ["teacher-accounts"] as const;
const teacherQueryKey = (id: string) => [...TEACHERS_QUERY_KEY, id] as const;

export function useTeachers() {
  return useApiQuery<TeacherResponse[]>({
    queryKey: TEACHERS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<TeacherResponse[]>>("/api/teachers", { signal });
      return response.data.data ?? [];
    },
  });
}

export function useTeacher(id: string) {
  const queryClient = useQueryClient();
  return useApiQuery<TeacherResponse | null>({
    queryKey: teacherQueryKey(id),
    enabled: !!id,
    initialData: () => queryClient.getQueryData<TeacherResponse[]>(TEACHERS_QUERY_KEY)
      ?.find((teacher) => teacher.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(TEACHERS_QUERY_KEY)?.dataUpdatedAt,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<TeacherResponse>>("/api/teachers/" + id, { signal });
      return response.data.data;
    },
  });
}

export function useTeacherAccounts() {
  return useApiQuery<TeacherAccountResponse[]>({
    queryKey: TEACHER_ACCOUNTS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<TeacherAccountResponse[]>>(
        "/api/teacher-accounts", { signal }
      );
      return response.data.data ?? [];
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const refreshLists = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY, exact: true }),
    queryClient.invalidateQueries({ queryKey: TEACHER_ACCOUNTS_QUERY_KEY, exact: true }),
  ]);

  return useApiMutation<TeacherResponse, CreateTeacherRequest>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<TeacherResponse>>("/api/teachers", payload);
      return response.data.data!;
    },
    onSuccess: (teacher) => {
      queryClient.setQueryData(teacherQueryKey(teacher.id), teacher);
      return refreshLists();
    },
    onError: (error) => {
      // Tài khoản có thể vừa bị khóa hoặc đã được người khác lập hồ sơ.
      if (error.status === 400 || error.status === 409) return refreshLists();
    },
  });
}
