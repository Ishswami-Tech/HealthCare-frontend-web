"use client";

import React, { useState, useEffect } from "react";
import {
  Instagram,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramPostProps {
  postUrl: string;
  className?: string;
  showCaption?: boolean;
  maxCaptionLength?: number;
  aspectRatio?: "square" | "portrait" | "landscape";
}

interface InstagramPostData {
  id: string;
  caption: string;
  media_url: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  permalink: string;
  timestamp: string;
  username?: string;
  likes_count?: number;
  comments_count?: number;
}

// Helper function to extract Instagram post ID from URL
export function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function InstagramPost({
  postUrl,
  className,
  showCaption = true,
  maxCaptionLength = 150,
  aspectRatio = "square",
}: InstagramPostProps) {
  const [postData, setPostData] = useState<InstagramPostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const postId = extractInstagramPostId(postUrl);

  const aspectRatioClasses = {
    square: "aspect-square",
    portrait: "aspect-[4/5]",
    landscape: "aspect-video",
  };

  // Mock data for demonstration (in real app, you'd fetch from Instagram API)
  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock Instagram post data
        const mockData: InstagramPostData = {
          id: postId || "mock-id",
          caption:
            "Experience the healing power of traditional Ayurveda at Shri Vishwamurti Ayurvedalay. Dr. Chandrakumar Deshmukh specializes in Panchakarma, Viddhakarma, and Agnikarma treatments for holistic wellness. Book your consultation today! #Ayurveda #NaturalHealing #Wellness #Panchakarma #TraditionalMedicine",
          media_url:
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
          media_type: "IMAGE",
          permalink: postUrl,
          timestamp: new Date().toISOString(),
          username: "Vishwamurti_ayurveda",
          likes_count: 127,
          comments_count: 23,
        };

        setPostData(mockData);
      } catch (error) {
        console.error("Failed to fetch Instagram post:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPostData();
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [postId, postUrl]);

  const truncatedCaption =
    postData?.caption && postData.caption.length > maxCaptionLength
      ? `${postData.caption.substring(0, maxCaptionLength)}...`
      : postData?.caption;

  const handleOpenInstagram = () => {
    window.open(postUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "bg-gray-200 animate-pulse",
            aspectRatioClasses[aspectRatio]
          )}
        />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !postData) {
    return (
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "bg-gray-100 flex items-center justify-center",
            aspectRatioClasses[aspectRatio]
          )}
        >
          <div className="text-center">
            <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Post unavailable</p>
            <p className="text-gray-500 text-sm mt-1">
              Unable to load Instagram post
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Instagram className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">
              {postData.username || "Vishwamurti_ayurveda"}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(postData.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenInstagram}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Open on Instagram"
        >
          <ExternalLink className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Post Media */}
      <div className={cn("relative", aspectRatioClasses[aspectRatio])}>
        <img
          src={postData.media_url}
          alt="Instagram post"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {postData.media_type === "VIDEO" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <Instagram className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              className="hover:text-red-500 transition-colors"
              aria-label="Like"
            >
              <Heart className="w-6 h-6" />
            </button>
            <button
              className="hover:text-blue-500 transition-colors"
              aria-label="Comment"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button
              className="hover:text-green-500 transition-colors"
              aria-label="Share"
            >
              <Share className="w-6 h-6" />
            </button>
          </div>
          <button
            className="hover:text-gray-700 transition-colors"
            aria-label="Save"
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes and Comments Count */}
        {(postData.likes_count || postData.comments_count) && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {postData.likes_count && <span>{postData.likes_count} likes</span>}
            {postData.comments_count && (
              <span>{postData.comments_count} comments</span>
            )}
          </div>
        )}

        {/* Caption */}
        {showCaption && postData.caption && (
          <div className="text-sm">
            <p className="text-gray-800">
              <span className="font-semibold">
                {postData.username || "Vishwamurti_ayurveda"}
              </span>{" "}
              {showFullCaption ? postData.caption : truncatedCaption}
            </p>
            {postData.caption.length > maxCaptionLength && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-gray-500 hover:text-gray-700 mt-1"
              >
                {showFullCaption ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* View on Instagram */}
        <button
          onClick={handleOpenInstagram}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View on Instagram
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Component for displaying multiple Instagram posts in a grid
interface InstagramGridProps {
  posts: Array<{
    id: string;
    postUrl: string;
    caption?: string;
    thumbnail?: string;
  }>;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  aspectRatio?: "square" | "portrait" | "landscape";
  showCaptions?: boolean;
}

export function InstagramGrid({
  posts,
  className,
  columns = 3,
  aspectRatio = "square",
  showCaptions = false,
}: InstagramGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  if (!posts || posts.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No Instagram posts available</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", gridClasses[columns], className)}>
      {posts.map((post) => (
        <InstagramPost
          key={post.id}
          postUrl={post.postUrl}
          aspectRatio={aspectRatio}
          showCaption={showCaptions}
        />
      ))}
    </div>
  );
}
