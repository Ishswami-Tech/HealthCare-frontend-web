"use client";

import { useMemo } from "react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHealthLibrary, useHealthLibraryItem } from "@/hooks/query/useHealthLibrary";
import { showErrorToast, showSuccessToast } from "@/hooks/utils/use-toast";
import { LibraryArticleView, type LibraryArticleState } from "./LibraryArticleView";
import { toArticle, toCardItem } from "./library.logic";

const RELATED_SIZE = 3;

/**
 * Data container for one library item. `useHealthLibraryItem` resolves to `null` for an id that
 * does not exist or is not published, which the view shows as "This item is not available".
 */
export function LibraryArticleContent({ itemId }: { itemId: string }) {
  const { session, isPending: authLoading } = useAuth();
  const signedIn = Boolean(session?.user?.id);

  const { data: post, isPending, error, refetch } = useHealthLibraryItem(itemId);
  const category = post?.category?.trim() ?? "";
  // One extra so the list still has three after this item is taken out.
  const relatedQuery = useHealthLibrary({ category, limit: RELATED_SIZE + 1 }, { enabled: category.length > 0 });

  const article = useMemo(() => (post ? toArticle(post) : null), [post]);
  const related = useMemo(
    () =>
      category
        ? (relatedQuery.data?.items ?? [])
            .filter((item) => item.id !== itemId)
            .slice(0, RELATED_SIZE)
            .map(toCardItem)
        : [],
    [relatedQuery.data, itemId, category],
  );

  const state: LibraryArticleState = post
    ? "ready"
    : error
      ? "error"
      : itemId && post === undefined && (authLoading || (signedIn && isPending))
        ? "loading"
        : "missing";

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showSuccessToast("Link copied");
    } catch (shareError) {
      // Closing the share sheet is not an error.
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      showErrorToast("The link could not be shared.");
    }
  };

  return (
    <DashboardPageShell>
      <LibraryArticleView
        state={state}
        article={article}
        related={related}
        relatedLoading={category.length > 0 && !relatedQuery.data && relatedQuery.isFetching}
        onShare={() => void handleShare()}
        onRetry={() => void refetch()}
      />
    </DashboardPageShell>
  );
}
