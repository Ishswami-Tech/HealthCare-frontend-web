"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubeVideoProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  thumbnail?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

// Helper function to extract video ID from various YouTube URL formats
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

export function YouTubeVideo({
  videoId,
  title,
  className,
  autoplay = false,
  muted = false,
  controls = true,
  aspectRatio = "16:9",
  thumbnail,
  onPlay,
  onPause,
  onEnd,
}: YouTubeVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const aspectRatioClasses = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
  };

  // Clean video ID
  const cleanVideoId = extractYouTubeVideoId(videoId) || videoId;

  // Build YouTube embed URL
  const embedUrl = new URL(`https://www.youtube.com/embed/${cleanVideoId}`);
  embedUrl.searchParams.set("rel", "0"); // Don't show related videos
  embedUrl.searchParams.set("modestbranding", "1"); // Minimal YouTube branding
  embedUrl.searchParams.set("enablejsapi", "1"); // Enable JavaScript API

  if (autoplay) embedUrl.searchParams.set("autoplay", "1");
  if (muted) embedUrl.searchParams.set("mute", "1");
  if (!controls) embedUrl.searchParams.set("controls", "0");

  // Thumbnail URL
  const thumbnailUrl =
    thumbnail || `https://img.youtube.com/vi/${cleanVideoId}/maxresdefault.jpg`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  // Listen for YouTube player events (requires YouTube IFrame API)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        if (data.event === "video-progress") {
          // Handle progress updates
        } else if (data.event === "video-ended") {
          setIsPlaying(false);
          onEnd?.();
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEnd]);

  if (hasError) {
    return (
      <div
        className={cn(
          "relative bg-gray-100 rounded-lg overflow-hidden",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <Play className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 font-medium">Video unavailable</p>
            <p className="text-gray-500 text-sm mt-1">
              Please check the video ID or try again later
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-gray-900 rounded-lg overflow-hidden group",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl.toString()}
        title={title || `YouTube video ${cleanVideoId}`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        loading="lazy"
      />

      {/* Custom overlay controls (optional) */}
      {showCustomControls && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all transform hover:scale-110"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-gray-900" />
            ) : (
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Video title overlay */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-white font-medium text-sm md:text-base line-clamp-2">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
}

// Component for displaying multiple YouTube videos in a grid
interface YouTubeVideoGridProps {
  videos: Array<{
    id: string;
    videoId: string;
    title: string;
    description?: string;
    thumbnail?: string;
  }>;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  aspectRatio?: "16:9" | "4:3" | "1:1";
}

export function YouTubeVideoGrid({
  videos,
  className,
  columns = 2,
  aspectRatio = "16:9",
}: YouTubeVideoGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  if (!videos || videos.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No videos available</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", gridClasses[columns], className)}>
      {videos.map((video) => (
        <div key={video.id} className="space-y-3">
          <YouTubeVideo
            videoId={video.videoId}
            title={video.title}
            aspectRatio={aspectRatio}
            thumbnail={video.thumbnail}
          />
          {video.description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {video.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
