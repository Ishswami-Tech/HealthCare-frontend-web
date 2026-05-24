"use client";

import React, { useState } from "react";
import Image from "next/image";
import { LazyMotion, domAnimation, m } from "motion/react";
import { cn } from "@/lib/utils";

const MotionImage = m(Image);

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?: string;
  loading?: "lazy" | "eager";
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  animate?: boolean;
  fallbackSrc?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  placeholder = "blur",
  blurDataURL,
  fill = false,
  sizes,
  objectFit = "cover",
  objectPosition = "center",
  loading = "lazy",
  unoptimized = false,
  onLoad,
  onError,
  animate = true,
  fallbackSrc = "/images/placeholder.jpg",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const currentSrc = isUsingFallback ? fallbackSrc : src;

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (fallbackSrc && !isUsingFallback) {
      setIsUsingFallback(true);
      setHasError(false);
      setIsLoading(true);
      return;
    }

    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const defaultBlurDataURL =
    blurDataURL ||
    `data:image/svg+xml;base64,${btoa(
      `<svg width="${width || 400}" height="${
        height || 300
      }" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Loading…
        </text>
      </svg>`
    )}`;

  const imageProps = {
    src: currentSrc,
    alt,
    quality,
    placeholder: placeholder as any,
    ...(placeholder === "blur" && { blurDataURL: defaultBlurDataURL }),
    priority,
    loading,
    unoptimized,
    onLoad: handleLoad,
    onError: handleError,
    ...(fill ? { fill: true } : { ...(width && { width }), ...(height && { height }) }),
    ...(sizes && { sizes }),
    style: {
      objectFit,
      objectPosition,
    },
    ...props,
  };

  const imageElement = animate ? (
    <LazyMotion features={domAnimation} strict>
      <MotionImage
        {...imageProps}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: isLoading ? 0 : 1,
          scale: isLoading ? 0.95 : 1,
        }}
        transition={{
          duration: 0.5,
          ease: [0.0, 0.0, 0.2, 1] as any,
        }}
        className={cn(
          "transition-opacity duration-500",
          isLoading && "opacity-0",
          hasError && "opacity-0"
        )}
      />
    </LazyMotion>
  ) : (
    <Image
      {...imageProps}
      className={cn(
        "transition-opacity duration-500",
        isLoading && "opacity-0",
        hasError && "opacity-0"
      )}
    />
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="size-8 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin" />
        </div>
      )}

      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
          <svg
            className="size-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">Image not available</span>
        </div>
      )}

      {imageElement}
    </div>
  );
};
