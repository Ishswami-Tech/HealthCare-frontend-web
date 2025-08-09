"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

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

/**
 * Optimized Image component with loading states, error handling, and animations
 * Built on top of Next.js Image component for maximum performance
 */
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
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    onError?.();
  };

  // Generate blur data URL if not provided (Next.js 15 optimized)
  const defaultBlurDataURL =
    blurDataURL ||
    `data:image/svg+xml;base64,${btoa(
      `<svg width="${width || 400}" height="${
        height || 300
      }" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>`
    )}`;

  const imageProps = {
    src: currentSrc,
    alt,
    quality,
    placeholder: placeholder as any,
    blurDataURL: placeholder === "blur" ? defaultBlurDataURL : undefined,
    priority,
    loading,
    unoptimized,
    onLoad: handleLoad,
    onError: handleError,
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
    style: {
      objectFit,
      objectPosition,
    },
    ...props,
  };

  const ImageComponent = animate ? motion(Image) : Image;
  const animationProps = animate
    ? {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
          opacity: isLoading ? 0 : 1,
          scale: isLoading ? 0.95 : 1,
        },
        transition: {
          duration: 0.5,
          ease: [0.0, 0.0, 0.2, 1],
        },
      }
    : {};

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
          <svg
            className="w-12 h-12 mb-2"
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

      {/* Main image */}
      <ImageComponent
        {...imageProps}
        {...animationProps}
        className={cn(
          "transition-opacity duration-500",
          isLoading && "opacity-0",
          hasError && "opacity-0"
        )}
      />
    </div>
  );
};

/**
 * Avatar component with optimized loading and fallback
 */
interface AvatarImageProps
  extends Omit<OptimizedImageProps, "width" | "height"> {
  size?: "sm" | "md" | "lg" | "xl";
  name?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  size = "md",
  name,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const sizePixels = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  // Generate initials fallback
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-red-500",
        sizeClasses[size],
        className
      )}
    >
      <OptimizedImage
        {...props}
        {...sizePixels[size]}
        className="rounded-full"
        objectFit="cover"
        fallbackSrc={`data:image/svg+xml;base64,${Buffer.from(
          `<svg width="${sizePixels[size].width}" height="${
            sizePixels[size].height
          }" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="url(#gradient)"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
              </linearGradient>
            </defs>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${
              sizePixels[size].width / 3
            }" font-weight="bold">
              ${initials}
            </text>
          </svg>`
        ).toString("base64")}`}
      />
    </div>
  );
};

/**
 * Hero image component with parallax and overlay support
 */
interface HeroImageProps extends OptimizedImageProps {
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
  parallaxOffset?: number;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  overlay = true,
  overlayOpacity = 0.4,
  parallax = false,
  parallaxOffset = 50,
  className,
  children,
  ...props
}) => {
  const ImageComponent = parallax ? motion(OptimizedImage) : OptimizedImage;
  const parallaxProps = parallax
    ? {
        initial: { y: 0 },
        whileInView: { y: -parallaxOffset },
        viewport: { once: false, amount: 0.5 },
        transition: { duration: 0.8, ease: "easeOut" },
      }
    : {};

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ImageComponent
        {...props}
        {...parallaxProps}
        priority
        quality={90}
        className="w-full h-full object-cover"
      />

      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};
