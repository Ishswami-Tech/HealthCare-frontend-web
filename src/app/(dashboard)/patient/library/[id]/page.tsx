"use client";

import { useParams } from "next/navigation";
import { LibraryArticleContent } from "../_components/LibraryArticleContent";

/** /patient/library/[id] — one article, guide or video of the clinic's Health Library. */
export default function PatientLibraryItemPage() {
  const params = useParams<{ id?: string }>();
  const itemId = String(params?.id || "").trim();

  return <LibraryArticleContent key={itemId} itemId={itemId} />;
}
