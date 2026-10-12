import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useApiQuery, useApiMutation } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangeRoleRequest,
  ResetPasswordRequest,
} from "@/types/user";

export const USERS_QUERY_KEY = ["users"] as const;

export function useUsers() {
  return useApiQuery<UserResponse[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserResponse[]>>("/api/users");
      return response.data.data ?? [];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, CreateUserRequest>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>("/api/users", payload);
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, { id: string; data: UpdateUserRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ApiResponse<UserResponse>>(`/api/users/${id}`, data);
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useChangeRole() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, { id: string; data: ChangeRoleRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>(
        `/api/users/${id}/change-role`,
        data
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, { id: string; data: ResetPasswordRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>(
        `/api/users/${id}/reset-password`,
        data
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, string>({
    mutationFn: async (id) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>(
        `/api/users/${id}/deactivate`
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useApiMutation<UserResponse, string>({
    mutationFn: async (id) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>(
        `/api/users/${id}/activate`
      );
      return response.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
