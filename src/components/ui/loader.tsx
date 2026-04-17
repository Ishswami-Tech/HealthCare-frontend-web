"use client";

import { Loader2 } from "lucide-react";

export function Loader({ className = "h-6 w-6" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export { Loader2 };
export default Loader;
