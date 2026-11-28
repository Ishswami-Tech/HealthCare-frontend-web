"use client";

import Link from "next/link";
import { BellRing, Building2, Clock, Stethoscope, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Kpi, Pill, SectionTitle, StatTile, Surface } from "@/components/tbd";
import { WAIT_ALERT_MINUTES, type QueueOverview } from "./queue-roles.logic";

/**
 * CaQueueOverview: the clinic admin's read-only view of the in-clinic queue across locations.
 * Numbers come from the checked-in entries of the clinic queue; the admin never calls a patient.
 */
export function QueueLocationOverview({ overview }: { overview: QueueOverview }) {
  return (
    <section aria-label="All locations" className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Waiting now" value={overview.waiting} icon={Users} tone="blue" hint="Checked in, all locations" />
        <Kpi label="With the doctor" value={overview.withDoctor} icon={Stethoscope} tone="mint" />
        <Kpi label="Average wait" value={`${overview.averageWait} min`} icon={Timer} tone="amber" hint={`Alert above ${WAIT_ALERT_MINUTES} min`} />
        <Kpi label="Longest wait" value={`${overview.longestWait} min`} icon={Clock} tone="rose" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface as="section" aria-label="Locations">
          <SectionTitle icon={Building2} title="Locations" count={overview.locations.length} description="In-clinic patients only. Video visits never appear here." />
          {overview.locations.length === 0 ? (
            <EmptyBlock icon={Building2} title="No active locations" description="Add a location to see its queue here." />
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {overview.locations.map((location) => (
                <li key={location.locationId} className="flex flex-col gap-3 rounded-[16px] border border-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-bold text-ink">{location.name}</span>
                    {location.overLimit > 0 ? (
                      <Pill tone="rose">Wait alert</Pill>
                    ) : location.waiting > 0 ? (
                      <Pill tone="amber">Busy</Pill>
                    ) : (
                      <Pill tone="slate">Quiet</Pill>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile value={location.waiting} label="Waiting" className="shadow-none" />
                    <StatTile value={location.withDoctor} label="In consult" tone="brand" className="shadow-none" />
                    <StatTile value={`${location.averageWait}m`} label="Avg wait" className="shadow-none" />
                    <StatTile
                      value={`${location.longestWait}m`}
                      label="Longest"
                      tone={location.overLimit > 0 ? "rose" : "ink"}
                      hint={location.longestWaitLabel || undefined}
                      className="shadow-none"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface as="section" aria-label="Queue alerts">
          <SectionTitle icon={BellRing} title="Queue alerts" count={overview.alerts.length} />
          {overview.alerts.length === 0 ? (
            <p className="m-0 text-[13px] text-ink-muted">Nobody has waited longer than {WAIT_ALERT_MINUTES} minutes.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {overview.alerts.map((alert) => (
                <li key={alert.id} className="flex flex-col gap-0.5 rounded-[12px] bg-[#fff1f2] px-3 py-2.5 dark:bg-rose-500/10">
                  <span className="text-[13px] font-bold text-ink">
                    {alert.label} waiting {alert.minutes} min
                  </span>
                  <span className="text-xs text-ink-muted">{alert.locationName} · alert limit is {WAIT_ALERT_MINUTES} min</span>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline">
            <Link href="/clinic-admin/check-ins">Open check-in log</Link>
          </Button>
        </Surface>
      </div>
    </section>
  );
}
