"use client";

import QueueContent from "./_components/QueueContent";

/**
 * Queue Management, shared by every staff role that can see the queue.
 * Data and role rules: `_components/useQueuePageData.ts`. Layout: `_components/QueueView.tsx`.
 */
export default function QueuePage() {
  return <QueueContent />;
}
