"use client";

import Link from "next/link";
import {
  paymentCollectionDisclosure,
  videoAppointmentNoRefundDisclosure,
} from "@/lib/legal/payment-disclosure";

export function PaymentDisclosure() {
  return (
    <div className="rounded-2xl border border-hair bg-[#f8fafc] p-4 text-xs leading-relaxed text-ink-muted dark:bg-well/50">
      <p>{paymentCollectionDisclosure}</p>
      <p className="mt-2 font-bold text-ink">
        {videoAppointmentNoRefundDisclosure}
      </p>
      <p className="mt-2">
        By continuing, you agree to the{" "}
        <Link href="/terms" prefetch={false} className="font-bold text-brand underline-offset-4 hover:underline">
          Terms
        </Link>
        ,{" "}
        <Link href="/refund-cancellation" prefetch={false} className="font-bold text-brand underline-offset-4 hover:underline">
          Refund & Cancellation Policy
        </Link>
        , and{" "}
        <Link href="/shipping-delivery" prefetch={false} className="font-bold text-brand underline-offset-4 hover:underline">
          Delivery Policy
        </Link>
        .
      </p>
    </div>
  );
}
