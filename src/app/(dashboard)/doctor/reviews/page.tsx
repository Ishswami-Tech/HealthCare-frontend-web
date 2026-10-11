"use client";

import { useMemo, useState } from "react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctorReviews } from "@/hooks/query/useDoctors";
import { DoctorProfileReviewsTab } from "../profile/_components/DoctorProfileReviewsTab";
import { normalizeDoctorReviews, readReviewStats } from "../profile/_components/doctor-profile.logic";

/** The latest patient reviews and ratings: GET /doctors/:id/reviews (the id is the doctor's User id). */
const REVIEWS_LIMIT = 10;

export default function DoctorReviews() {
  const { session } = useAuth();
  const doctorId = session?.user?.id || "";
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch } = useDoctorReviews(doctorId, REVIEWS_LIMIT, page);

  const reviews = useMemo(() => normalizeDoctorReviews(data), [data]);
  const stats = useMemo(() => readReviewStats(data), [data]);
  const notFound = (error as { statusCode?: number } | null)?.statusCode === 404;

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Doctor Reviews"
        title="Reviews"
        description="What your patients say about their video and in-clinic visits."
      />
      <DoctorProfileReviewsTab
        reviews={reviews}
        // Without a signed-in doctor the query is switched off and stays "pending".
        isLoading={Boolean(doctorId) && isPending}
        loadFailed={Boolean(error) && !notFound && reviews.length === 0}
        notAvailable={notFound && reviews.length === 0}
        onRetry={() => void refetch()}
        stats={stats}
        onPageChange={setPage}
      />
    </DashboardPageShell>
  );
}
