"use client";

import * as React from "react";
import { Tabs } from "@/components/ui/tabs";
import {
  useHashTab,
  type UseHashTabOptions,
} from "@/hooks/navigation/useHashTab";

type HashTabsProps<T extends string> = UseHashTabOptions<T> &
  Omit<React.ComponentProps<typeof Tabs>, "value" | "onValueChange" | "defaultValue">;

/**
 * Drop-in Tabs wrapper that keeps the active tab in the URL hash.
 * Use this (or `useHashTab`) everywhere — do not invent per-page hash logic.
 */
export function HashTabs<T extends string>({
  tabs,
  defaultValue,
  aliases,
  namespace,
  acceptQueryFallback,
  queryParam,
  children,
  ...tabsProps
}: HashTabsProps<T>) {
  const { tab, setTab } = useHashTab({
    tabs,
    defaultValue,
    aliases,
    namespace,
    acceptQueryFallback,
    queryParam,
  });

  return (
    <Tabs {...tabsProps} value={tab} onValueChange={setTab}>
      {children}
    </Tabs>
  );
}
