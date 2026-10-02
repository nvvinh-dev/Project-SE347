import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from "@tanstack/react-query";
import { toApiError, ApiError } from "@/lib/axios";

/**
 * useApiQuery: Wrapper của TanStack useQuery (D13)
 * Tự động chuyển AxiosError sang ApiError có thông điệp tiếng Việt
 */
export function useApiQuery<TData = unknown>(
  options: Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, "queryKey" | "queryFn"> & {
    queryKey: QueryKey;
    queryFn: () => Promise<TData>;
  }
) {
  return useQuery<TData, ApiError>({
    ...options,
    queryFn: async () => {
      try {
        return await options.queryFn();
      } catch (error) {
        throw toApiError(error);
      }
    },
  });
}

/**
 * useApiMutation: Wrapper của TanStack useMutation (D13)
 * Tự động chuyển AxiosError sang ApiError có thông điệp tiếng Việt
 */
export function useApiMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, ApiError, TVariables, TContext>
) {
  return useMutation<TData, ApiError, TVariables, TContext>({
    ...options,
    mutationFn: async (...args) => {
      try {
        if (!options.mutationFn) {
          throw new Error("mutationFn is required");
        }
        // Gọi mutationFn gốc với các tham số truyền vào
        return await (options.mutationFn as (...params: unknown[]) => Promise<TData>)(...args);
      } catch (error) {
        throw toApiError(error);
      }
    },
  });
}
