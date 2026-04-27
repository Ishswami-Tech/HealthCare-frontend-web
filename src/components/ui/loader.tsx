"use client";

import { InlineLoader } from "@/components/ui/loading";
import { Loader2 } from "lucide-react";

export function Loader({ className = "h-6 w-6" }: { className?: string }) {
  return <InlineLoader className={className} />;
}

export { Loader2 };
export default Loader;
