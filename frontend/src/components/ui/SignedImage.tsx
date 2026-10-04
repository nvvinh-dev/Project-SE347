"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SignedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** URL ký sẵn có từ API list/detail (nếu có). */
  src?: string | null;
  /**
   * Callback xin URL ký hạn mới từ API theo id của module.
   * Ví dụ: `() => apiClient.get(`/api/media/photos/${id}/url`).then(r => r.data.data.url)`
   * Component sẽ gọi hàm này khi:
   * - Không có `src` ban đầu
   * - URL ảnh bị lỗi (hết hạn) — gọi lại tối đa 1 lần rồi hiện fallback
   */
  getUrl?: () => Promise<string>;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
}

export function SignedImage({
  src,
  getUrl,
  alt = "Ảnh",
  className,
  fallbackIcon,
  fallbackText,
  ...props
}: SignedImageProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(src ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!src && !!getUrl);
  const [hasError, setHasError] = useState<boolean>(false);
  // Đếm số lần đã retry xin URL mới khi ảnh lỗi (tối đa 1 lần)
  const retryCountRef = useRef(0);
  // Theo dõi mounted để tránh setState sau unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Khi src thay đổi (ví dụ chuyển ảnh khác), đặt lại toàn bộ state
  useEffect(() => {
    retryCountRef.current = 0;
    setHasError(false);

    if (src) {
      setDisplayUrl(src);
      setIsLoading(false);
    } else if (getUrl) {
      // Không có src sẵn → gọi getUrl lần đầu
      setIsLoading(true);
      setDisplayUrl(null);
      getUrl()
        .then((url) => {
          if (mountedRef.current) {
            setDisplayUrl(url);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setHasError(true);
          }
        })
        .finally(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        });
    } else {
      // Không có src lẫn getUrl → hiện fallback
      setDisplayUrl(null);
      setIsLoading(false);
    }
  }, [src, getUrl]);

  // Xử lý khi ảnh lỗi (URL hết hạn): gọi getUrl() lại tối đa 1 lần
  const handleImageError = useCallback(() => {
    if (getUrl && retryCountRef.current < 1) {
      retryCountRef.current += 1;
      setIsLoading(true);
      getUrl()
        .then((url) => {
          if (mountedRef.current) {
            setDisplayUrl(url);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setHasError(true);
          }
        })
        .finally(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        });
    } else {
      setHasError(true);
    }
  }, [getUrl]);

  // --- Render ---

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-background/80 text-muted animate-pulse",
          className
        )}
      >
        <svg className="h-5 w-5 animate-spin text-brand" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (hasError || !displayUrl) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-background border border-border text-muted",
          className
        )}
      >
        {fallbackIcon || (
          <svg className="h-6 w-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        {fallbackText && <span className="mt-1 text-[10px] text-muted-light">{fallbackText}</span>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displayUrl}
      alt={alt}
      onError={handleImageError}
      className={className}
      {...props}
    />
  );
}
