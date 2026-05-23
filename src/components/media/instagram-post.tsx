"use client";

import Image from "next/image";

import { useEffect, useReducer } from "react";
import { Bookmark, ExternalLink, Heart, Instagram, MessageCircle, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { extractInstagramPostId } from "@/components/media/instagram-post-utils";

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

interface InstagramPostState {
  postData: InstagramPostData | null;
  isLoading: boolean;
  hasError: boolean;
  showFullCaption: boolean;
}

type InstagramPostAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; postData: InstagramPostData }
  | { type: "LOAD_ERROR" }
  | { type: "TOGGLE_CAPTION" };

function instagramPostReducer(
  state: InstagramPostState,
  action: InstagramPostAction
): InstagramPostState {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        isLoading: true,
        hasError: false,
      };
    case "LOAD_SUCCESS":
      return {
        ...state,
        postData: action.postData,
        isLoading: false,
      };
    case "LOAD_ERROR":
      return {
        ...state,
        hasError: true,
        isLoading: false,
      };
    case "TOGGLE_CAPTION":
      return {
        ...state,
        showFullCaption: !state.showFullCaption,
      };
    default:
      return state;
  }
}

export function InstagramPost({
  postUrl,
  className,
  showCaption = true,
  maxCaptionLength = 150,
  aspectRatio = "square",
}: InstagramPostProps) {
  const [state, dispatch] = useReducer(instagramPostReducer, {
    postData: null,
    isLoading: true,
    hasError: false,
    showFullCaption: false,
  });
  const { postData, isLoading, hasError, showFullCaption } = state;

  const postId = extractInstagramPostId(postUrl);

  const aspectRatioClasses = {
    square: "aspect-square",
    portrait: "aspect-[4/5]",
    landscape: "aspect-video",
  };

  // Mock data for demonstration (in real app, you'd fetch from Instagram API)
  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const fetchPostData = () => {
      dispatch({ type: "LOAD_START" });

      timeoutId = setTimeout(() => {
        if (!isActive) {
          return;
        }
        // Mock Instagram post data
        const mockData: InstagramPostData = {
          id: postId || "mock-id",
          caption:
            "Experience the healing power of traditional Ayurveda with Dr.Chandrakumar Deshmukh. Dr. Chandrakumar Deshmukh specializes in Panchakarma, Viddhakarma, and Agnikarma treatments for holistic wellness. Book your consultation today! #Ayurveda #NaturalHealing #Wellness #Panchakarma #TraditionalMedicine",
            media_url:
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
          media_type: "IMAGE",
          permalink: postUrl,
          timestamp: new Date().toISOString(),
          username: "drchandrakumardeshmukh",
          likes_count: 127,
          comments_count: 23,
        };

        dispatch({ type: "LOAD_SUCCESS", postData: mockData });
      }, 1000);
    };

    if (postId) {
      fetchPostData();
    } else {
      dispatch({ type: "LOAD_ERROR" });
    }

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
        <div className="p-4 gap-y-3">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          </div>
          <div className="gap-y-2">
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
            <Instagram className="size-12 text-gray-400 mx-auto mb-2" />
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
          <div className="size-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Instagram className="size-4 text-gray-600" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">
              {postData.username || "drchandrakumardeshmukh"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateInIST(postData.timestamp)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenInstagram}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Open on Instagram"
        >
          <ExternalLink className="size-4 text-gray-600" />
        </button>
      </div>

      {/* Post Media */}
      <div className={cn("relative", aspectRatioClasses[aspectRatio])}>
        <Image
          src={postData.media_url}
          alt="Instagram post"
          fill
          className="absolute inset-0 object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {postData.media_type === "VIDEO" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-950/50 rounded-full p-3">
              <Instagram className="size-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hover:text-red-500 transition-colors"
              aria-label="Like"
            >
              <Heart className="size-6" />
            </button>
            <button
              type="button"
              className="hover:text-blue-500 transition-colors"
              aria-label="Comment"
            >
              <MessageCircle className="size-6" />
            </button>
            <button
              type="button"
              className="hover:text-green-500 transition-colors"
              aria-label="Share"
            >
              <Share className="size-6" />
            </button>
          </div>
          <button
            type="button"
            className="hover:text-gray-700 transition-colors"
            aria-label="Save"
          >
            <Bookmark className="size-6" />
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
                {postData.username || "drchandrakumardeshmukh"}
              </span>{" "}
              {showFullCaption ? postData.caption : truncatedCaption}
            </p>
            {postData.caption.length > maxCaptionLength && (
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_CAPTION" })}
                className="text-gray-500 hover:text-gray-700 mt-1"
              >
                {showFullCaption ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* View on Instagram */}
        <button
          type="button"
          onClick={handleOpenInstagram}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View on Instagram
          <ExternalLink className="size-3" />
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
        <Instagram className="size-12 text-gray-400 mx-auto mb-4" />
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

