"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDateInIST } from "@/lib/utils/appointmentUtils";
import type { DoctorReview } from "./doctor-profile.types";

interface DoctorProfileReviewsTabProps {
  recentReviews: DoctorReview[];
}

export function DoctorProfileReviewsTab({
  recentReviews,
}: DoctorProfileReviewsTabProps) {
  return (
    <div className="gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-5" />
            Patient Reviews & Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">
            <Star className="mx-auto mb-3 size-10 opacity-30" />
            <p className="text-sm">Rating data not yet available</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-y-4">
            {recentReviews.map((review) => (
              <div
                key={`${review.patientName}-${review.date}`}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium">{review.patientName}</span>
                      <div className="flex">
                        {Array.from({ length: review.rating }, (_, star) => star + 1).map(
                          (star) => (
                            <Star
                              key={`star-${review.patientName}-${review.date}-${star}`}
                              className="size-4 fill-current text-yellow-500"
                            />
                          ),
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.review}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateInIST(review.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
