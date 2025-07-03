"use client";

import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLoadingOverlay } from "./LoadingOverlayContext";
import { useRouter } from "next/navigation";
import { debounce } from "@/lib/utils";

const SHOW_DELAY = 200;
const HIDE_DELAY = 150;

export function GlobalLoadingOverlayListener() {
  const isFetching = useIsFetching();
  const { setOverlay } = useLoadingOverlay();
  const router = useRouter();

  // Debounced overlay handlers
  const showDebounced = useRef(
    debounce(
      () =>
        setOverlay({ show: true, variant: "default", message: "Loading..." }),
      SHOW_DELAY
    )
  ).current;
  const hideDebounced = useRef(
    debounce(() => setOverlay({ show: false }), HIDE_DELAY)
  ).current;

  // React Query loading
  useEffect(() => {
    if (isFetching > 0) {
      showDebounced();
    } else {
      hideDebounced();
    }
    // Cleanup on unmount
    return () => {
      hideDebounced();
    };
  }, [isFetching, showDebounced, hideDebounced]);

  // Route transitions
  useEffect(() => {
    const handleStart = () => showDebounced();
    const handleComplete = () => hideDebounced();

    const origPush = router.push;
    const origReplace = router.replace;
    router.push = (...args) => {
      handleStart();
      return origPush.apply(router, args);
    };
    router.replace = (...args) => {
      handleStart();
      return origReplace.apply(router, args);
    };

    window.addEventListener("popstate", handleStart);
    window.addEventListener("popstate", handleComplete);

    return () => {
      router.push = origPush;
      router.replace = origReplace;
      window.removeEventListener("popstate", handleStart);
      window.removeEventListener("popstate", handleComplete);
    };
  }, [router, showDebounced, hideDebounced]);

  return null;
}
