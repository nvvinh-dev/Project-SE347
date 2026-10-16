import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useApiMutation, useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  ChildProfileRequest,
  ChildResponse,
  GuardianResponse,
  LinkGuardianRequest,
} from "@/types/children";

export const CHILDREN_QUERY_KEY = ["children"] as const;
export const PARENT_ACCOUNTS_QUERY_KEY = ["parent-accounts"] as const;

const childQueryKey = (id: string) => [...CHILDREN_QUERY_KEY, id] as const;
const guardiansQueryKey = (childId: string) =>
  [...childQueryKey(childId), "guardians"] as const;

export function useChildren() {
  return useApiQuery<ChildResponse[]>({
    queryKey: CHILDREN_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<ChildResponse[]>>("/api/children", { signal });
      return response.data.data ?? [];
    },
  });
}

export function useChild(id: string) {
  return useApiQuery<ChildResponse | null>({
    queryKey: childQueryKey(id),
    enabled: !!id,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<ChildResponse>>(`/api/children/${id}`, { signal });
      return response.data.data;
    },
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useApiMutation<ChildResponse, ChildProfileRequest>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ApiResponse<ChildResponse>>("/api/children", payload);
      return response.data.data!;
    },
    onSuccess: (child) => {
      queryClient.setQueryData(childQueryKey(child.id), child);
      queryClient.invalidateQueries({ queryKey: CHILDREN_QUERY_KEY });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useApiMutation<ChildResponse, { id: string; data: ChildProfileRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ApiResponse<ChildResponse>>(`/api/children/${id}`, data);
      return response.data.data!;
    },
    onSuccess: (child) => {
      queryClient.setQueryData(childQueryKey(child.id), child);
      queryClient.invalidateQueries({ queryKey: CHILDREN_QUERY_KEY });
    },
  });
}

export function useGuardians(childId: string) {
  return useApiQuery<GuardianResponse[]>({
    queryKey: guardiansQueryKey(childId),
    enabled: !!childId,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<GuardianResponse[]>>(
        `/api/children/${childId}/guardians`,
        { signal }
      );
      return response.data.data ?? [];
    },
  });
}

export function useSearchParentAccounts(search: string) {
  const term = search.trim();
  return useApiQuery<GuardianResponse[]>({
    queryKey: [...PARENT_ACCOUNTS_QUERY_KEY, term],
    enabled: term.length >= 2,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<GuardianResponse[]>>("/api/parent-accounts", {
        params: { search: term },
        signal,
      });
      return response.data.data ?? [];
    },
  });
}

export function useLinkGuardian() {
  const queryClient = useQueryClient();
  return useApiMutation<GuardianResponse, { childId: string; data: LinkGuardianRequest }>({
    mutationFn: async ({ childId, data }) => {
      const response = await apiClient.post<ApiResponse<GuardianResponse>>(
        `/api/children/${childId}/guardians`,
        data
      );
      return response.data.data!;
    },
    onSuccess: (_guardian, { childId }) => {
      queryClient.invalidateQueries({ queryKey: guardiansQueryKey(childId) });
    },
  });
}

export function useUnlinkGuardian() {
  const queryClient = useQueryClient();
  return useApiMutation<GuardianResponse, { childId: string; guardianUserId: string }>({
    mutationFn: async ({ childId, guardianUserId }) => {
      const response = await apiClient.delete<ApiResponse<GuardianResponse>>(
        `/api/children/${childId}/guardians/${guardianUserId}`
      );
      return response.data.data!;
    },
    onSuccess: (_guardian, { childId }) => {
      queryClient.invalidateQueries({ queryKey: guardiansQueryKey(childId) });
    },
  });
}
