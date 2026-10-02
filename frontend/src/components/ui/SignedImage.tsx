"use client";

import React, { useState, useEffect } from "react";
import { apiClient, toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";

export interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string | null;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
}

export function SignedImage({
  storagePath,
  src,
  alt = "Ảnh",
  className,
  fallbackIcon,
  fallbackText,
  ...props
}: SignedImageProps) {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(storagePath));
  const [hasError, setHasError] = useState<boolean>(false);

  const displayUrl = storagePath ? fetchedUrl : (src as string || null);

  useEffect(() => {
    if (!storagePath) return;

    let isMounted = true;
    // Bắt đầu fetch URL ký hạn (D53)
    apiClient
      .get<{ data?: { url?: string }; url?: string }>("/api/media/download-url", {
        params: { path: storagePath },
      })
      .then((res) => {
        if (!isMounted) return;
        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          setFetchedUrl(url);
        } else {
          setHasError(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Lỗi khi xin URL ký hạn ảnh:", toApiError(err).message);
        setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [storagePath]);

  if (storagePath && isLoading) {
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
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}

// Alias tương thích
export const SecureImage = SignedImage;
export type SecureImageProps = SignedImageProps;
