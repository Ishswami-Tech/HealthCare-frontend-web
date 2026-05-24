"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RouteRedirectProps {
  target: string;
}

export function RouteRedirect({ target }: RouteRedirectProps) {
  const { replace } = useRouter();

  useEffect(() => {
    replace(target);
  }, [replace, target]);

  return null;
}
