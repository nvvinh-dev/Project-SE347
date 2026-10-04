import { useState, useCallback } from "react";
import { toApiError, ApiError } from "@/lib/axios";

export function useApiError() {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown): ApiError => {
    const apiErr = err instanceof ApiError ? err : toApiError(err);
    setError(apiErr);
    return apiErr;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    errorMessage: error?.message || null,
    validationErrors: error?.errors || null,
    handleError,
    clearError,
    setError,
  };
}
