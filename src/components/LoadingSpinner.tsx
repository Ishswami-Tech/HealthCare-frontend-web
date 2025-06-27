import React from "react";

export default function LoadingSpinner({ color = "text-blue-600 border-blue-600", size = "h-12 w-12" }: { color?: string; size?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${color}`}></div>
    </div>
  );
}
