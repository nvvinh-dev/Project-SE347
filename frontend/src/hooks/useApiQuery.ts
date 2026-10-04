import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  QueryFunctionContext,
} from "@tanstack/react-query";
import { toApiError, ApiError } from "@/lib/axios";

/**
 * useApiQuery: Wrapper của TanStack useQuery (D13)
 * Tự động chuyển lỗi sang ApiError có thông điệp tiếng Việt.
 * Truyền context của TanStack vào queryFn để còn signal hủy request.
 */
export function useApiQuery<TData = unknown>(
  options: Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, "queryKey" | "queryFn"> & {
    queryKey: QueryKey;
    queryFn: (context: QueryFunctionContext<QueryKey>) => Promise<TData>;
  }
) {
  return useQuery<TData, ApiError>({
    ...options,
    queryFn: async (context) => {
      try {
        return await options.queryFn(context);
      } catch (error) {
        throw error instanceof ApiError ? error : toApiError(error);
      }
    },
  });
}

/**
 * useApiMutation: Wrapper của TanStack useMutation (D13)
 * Tự động chuyển lỗi sang ApiError có thông điệp tiếng Việt.
 * mutationFn là bắt buộc trong kiểu.
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: Omit<UseMutationOptions<TData, ApiError, TVariables, TContext>, "mutationFn"> & {
    mutationFn: (variables: TVariables) => Promise<TData>;
  }
) {
  return useMutation<TData, ApiError, TVariables, TContext>({
    ...options,
    mutationFn: async (variables) => {
      try {
        return await options.mutationFn(variables);
      } catch (error) {
        throw error instanceof ApiError ? error : toApiError(error);
      }
    },
  });
}
