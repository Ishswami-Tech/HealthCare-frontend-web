"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { LibraryTopicContent } from "../../_components/LibraryTopicContent";
import { decodeTopicParam } from "../../_components/library.logic";

/** /patient/library/topic/[topic] — every library item of one category (reads `?page`). */
export default function PatientLibraryTopicPage() {
  const params = useParams<{ topic?: string }>();
  const topic = decodeTopicParam(params?.topic);

  return (
    <Suspense fallback={null}>
      <LibraryTopicContent key={topic} topic={topic} />
    </Suspense>
  );
}
