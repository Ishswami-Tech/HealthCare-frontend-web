"use client";

import dynamic from "next/dynamic";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatRupees } from "./billing.logic";

const CHART_CONFIG = {
  paid: { label: "Paid", theme: { light: "#047857", dark: "#34d399" } },
  pending: { label: "Pending", theme: { light: "#fbbf24", dark: "#fbbf24" } },
} satisfies ChartConfig;

interface SplitBarProps {
  paid: number;
  pending: number;
}

// recharts is heavy; it is loaded only when the Overview tab draws the bar.
const SplitBar = dynamic(
  async () => {
    const { Bar, BarChart, XAxis, YAxis } = await import("recharts");

    return function SplitBar({ paid, pending }: SplitBarProps) {
      // A lone segment gets both ends rounded.
      const paidRadius: [number, number, number, number] = pending > 0 ? [6, 0, 0, 6] : [6, 6, 6, 6];
      const pendingRadius: [number, number, number, number] = paid > 0 ? [0, 6, 6, 0] : [6, 6, 6, 6];
      return (
        <BarChart
          layout="vertical"
          data={[{ name: "Billed amount", paid, pending }]}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
          accessibilityLayer={false}
        >
          <XAxis type="number" hide domain={[0, paid + pending]} />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            allowEscapeViewBox={{ x: false, y: true }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value: number, name: string) => (
                  <span className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="size-2.5 rounded-[2px]"
                        style={{ background: `var(--color-${name})` }}
                        aria-hidden="true"
                      />
                      {name === "paid" ? "Paid" : "Pending"}
                    </span>
                    <span className="font-bold text-foreground">{formatRupees(Number(value))}</span>
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="paid" stackId="billed" fill="var(--color-paid)" radius={paidRadius} isAnimationActive={false} />
          <Bar
            dataKey="pending"
            stackId="billed"
            fill="var(--color-pending)"
            radius={pendingRadius}
            isAnimationActive={false}
          />
        </BarChart>
      );
    };
  },
  { ssr: false, loading: () => null },
);

/**
 * Paid revenue against the amount still pending, as one stacked bar with a legend under it.
 * The caller shows an empty state instead when both amounts are zero.
 */
export function BillingSplitChart({
  paid,
  pending,
  paidShare,
}: {
  paid: number;
  pending: number;
  /** Paid part of the billed amount, 0 to 100. */
  paidShare: number;
}) {
  const pendingShare = 100 - paidShare;
  return (
    <figure className="m-0 flex flex-col gap-2.5">
      <ChartContainer
        config={CHART_CONFIG}
        className="aspect-auto h-3 w-full overflow-visible rounded-[6px] bg-well"
        role="img"
        aria-label={`Paid ${formatRupees(paid)}, ${paidShare}% of the billed amount. Pending ${formatRupees(pending)}, ${pendingShare}%.`}
      >
        <SplitBar paid={paid} pending={pending} />
      </ChartContainer>
      <figcaption className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-[#047857] dark:bg-[#34d399]" aria-hidden="true" />
          Paid · {paidShare}% of billed amount
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-[#fbbf24]" aria-hidden="true" />
          Pending · {pendingShare}%
        </span>
      </figcaption>
    </figure>
  );
}
