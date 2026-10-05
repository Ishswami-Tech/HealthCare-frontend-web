"use client";

import { CircleAlert, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, Note } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { ProfileCard } from "./DoctorProfileParts";
import { reviewDateLabel, summarizeReviews } from "./doctor-profile.logic";
import type { DoctorProfileReviewsState } from "./doctor-profile.types";

type DoctorProfileReviewsTabProps = DoctorProfileReviewsState;

function Stars({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex shrink-0 gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size,
            star <= rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-transparent text-[#cbd5e1] dark:text-slate-600",
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function EmptyLine({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-line bg-[#f8fafc] p-[18px] dark:bg-white/5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-well text-ink-muted">
        <Star className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-bold text-ink-soft">{children}</span>
    </div>
  );
}

export function DoctorProfileReviewsTab({
  reviews,
  isLoading,
  loadFailed,
  notAvailable = false,
  onRetry,
}: DoctorProfileReviewsTabProps) {
  const summary = summarizeReviews(reviews);

  return (
    <div className="flex flex-col gap-5">
      <ProfileCard icon={Star} title="Patient Reviews & Ratings">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-well" aria-hidden="true" />
        ) : summary ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-start gap-1 sm:w-[170px]">
              <span className="text-[34px] font-extrabold leading-none text-ink">{summary.average}</span>
              <Stars rating={summary.stars} size="size-4" />
              <span className="text-xs text-ink-muted">
                From {summary.count === 1 ? "the latest review" : `the latest ${summary.count} reviews`}
              </span>
            </div>
            <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-1.5 p-0">
              {summary.breakdown.map((row) => (
                <li key={row.stars} className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <span className="w-[52px] shrink-0 whitespace-nowrap font-semibold text-ink-soft">
                    {row.stars} {row.stars === 1 ? "star" : "stars"}
                  </span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                    <span className="block h-full rounded-full bg-[#f59e0b]" style={{ width: `${row.percent}%` }} />
                  </span>
                  <span className="w-6 shrink-0 text-right font-semibold">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyLine>Rating data not yet available</EmptyLine>
        )}
      </ProfileCard>

      <ProfileCard title="Recent Reviews">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            <span className="sr-only" role="status">
              Loading reviews…
            </span>
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-[74px] animate-pulse rounded-[14px] bg-well" aria-hidden="true" />
            ))}
          </div>
        ) : notAvailable ? (
          <p className="m-0 text-[13px] text-ink-muted">Patient reviews are not available yet.</p>
        ) : loadFailed ? (
          <Note tone="rose" icon={CircleAlert}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span role="alert">Reviews could not be loaded.</span>
              {onRetry ? (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              ) : null}
            </div>
          </Note>
        ) : reviews.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-muted">
            No reviews yet. Reviews from your patients show up here.
          </p>
        ) : (
          <ul className="m-0 flex min-w-0 list-none flex-col gap-2.5 p-0">
            {reviews.map((review) => {
              const date = reviewDateLabel(review.date);
              return (
                <li
                  key={review.id ?? `${review.patientName}-${review.date}`}
                  className="flex gap-3 rounded-[14px] border border-line p-3.5"
                >
                  <InitialsAvatar name={review.patientName} size={36} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-sm font-bold text-ink">{review.patientName}</span>
                      <Stars rating={review.rating} />
                      <span className="flex-1" />
                      {date ? <span className="text-xs text-ink-muted">{date}</span> : null}
                    </div>
                    {review.review ? (
                      <p className="m-0 text-[13px] leading-normal text-ink-soft">{review.review}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}
