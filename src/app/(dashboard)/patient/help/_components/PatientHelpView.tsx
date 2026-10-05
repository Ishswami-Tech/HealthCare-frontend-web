"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Mail, MapPin, MessageCircle, Minus, Phone, Plus } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { EmptyBlock, PageHead, SoftCard, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { HelpContact, HelpFaq } from "./help.content";

export interface PatientHelpViewProps {
  /** First name for the greeting; left out when it is not known. */
  firstName?: string | undefined;
  contacts: HelpContact[];
  address?: string | undefined;
  hours?: string | undefined;
  /** The public contact page (message form, map). */
  contactPageHref: string;
  backHref: string;
  faqs: HelpFaq[];
}

const CONTACT_ICONS: Record<HelpContact["key"], TbdIcon> = {
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
};

const DOT_TONES: Record<HelpFaq["tone"], string> = {
  green: "bg-[#047857]",
  orange: "bg-[#ea580c]",
  blue: "bg-[#2563eb]",
};

/** Help & support: ways to reach the clinic and common questions. Props only. */
export function PatientHelpView({
  firstName,
  contacts,
  address,
  hours,
  contactPageHref,
  backHref,
  faqs,
}: PatientHelpViewProps) {
  const [openIds, setOpenIds] = useState<string[]>(() => (faqs[0] ? [faqs[0].id] : []));
  const toggle = (id: string) =>
    setOpenIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  return (
    <DashboardPageShell>
      <PageHead title="Help & support" backHref={backHref} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <SoftCard as="section" aria-labelledby="help-contact-title">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
              <h2 id="help-contact-title" className="m-0 text-xl font-extrabold tracking-[-0.3px] text-ink">
                {firstName ? `How can we help, ${firstName}?` : "How can we help?"}
              </h2>
              <p className="m-0 text-[13px] text-ink-muted">Reach the clinic the way that suits you.</p>
            </div>

            {contacts.length > 0 ? (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {contacts.map((contact) => {
                  const Icon = CONTACT_ICONS[contact.key];
                  const external = contact.key === "whatsapp";
                  return (
                    <li key={contact.key}>
                      <a
                        href={contact.href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex min-h-[60px] items-center gap-3 rounded-2xl bg-card px-3.5 py-2 text-ink transition-shadow hover:shadow-card focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        <span
                          className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-mint-soft text-brand"
                          aria-hidden="true"
                        >
                          <Icon className="size-[18px]" strokeWidth={2.2} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-extrabold">{contact.label}</span>
                          <span className="truncate text-xs text-ink-muted">{contact.detail}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-[#94a3b8]" strokeWidth={2.4} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 rounded-2xl bg-card px-4 py-3.5 text-[13px] text-ink-muted">
                The clinic has not shared a phone number or email yet. Use the contact page below.
              </p>
            )}

            {address || hours ? (
              <dl className="m-0 flex flex-col gap-2 text-[13px] text-ink-soft">
                {address ? (
                  <div className="flex items-start gap-2.5">
                    <dt className="mt-0.5 shrink-0">
                      <MapPin className="size-4 text-brand" strokeWidth={2.2} aria-hidden="true" />
                      <span className="sr-only">Address</span>
                    </dt>
                    <dd className="m-0 min-w-0">{address}</dd>
                  </div>
                ) : null}
                {hours ? (
                  <div className="flex items-start gap-2.5">
                    <dt className="mt-0.5 shrink-0">
                      <Clock className="size-4 text-brand" strokeWidth={2.2} aria-hidden="true" />
                      <span className="sr-only">Clinic hours</span>
                    </dt>
                    <dd className="m-0 min-w-0">{hours}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <a
              href={contactPageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start text-[13px] font-bold text-brand underline-offset-4 hover:underline"
            >
              Send a message from the contact page
            </a>
          </div>
        </SoftCard>

        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="help-faq-title">
          <h2 id="help-faq-title" className="m-0 text-base font-bold text-ink">
            Common questions
          </h2>
          {faqs.length === 0 ? (
            <div className="rounded-[18px] bg-card shadow-card dark:border dark:border-border/70">
              <EmptyBlock title="No questions here yet" description="Reach the clinic and we will help you." />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-2.5">
              {faqs.map((faq) => {
                const open = openIds.includes(faq.id);
                const panelId = `help-faq-${faq.id}`;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-[18px] bg-card shadow-card dark:border dark:border-border/70"
                  >
                    <h3 className="m-0">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => toggle(faq.id)}
                        className="flex min-h-[58px] w-full items-center gap-3 px-5 py-2 text-left text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
                      >
                        <span className={cn("size-2.5 shrink-0 rounded-full", DOT_TONES[faq.tone])} aria-hidden="true" />
                        <span className="flex-1 text-sm font-bold">{faq.question}</span>
                        {open ? (
                          <Minus className="size-[18px] shrink-0 text-brand" strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Plus className="size-[18px] shrink-0 text-brand" strokeWidth={2.6} aria-hidden="true" />
                        )}
                      </button>
                    </h3>
                    <div id={panelId} hidden={!open} className="pr-5 pb-[18px] pl-[42px] sm:pr-14">
                      <p className="m-0 text-[13px] leading-[1.6] text-ink-soft">{faq.answer}</p>
                      {faq.links && faq.links.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {faq.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="inline-flex items-center gap-1 text-[13px] font-bold text-brand underline-offset-4 hover:underline"
                            >
                              {link.label}
                              <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardPageShell>
  );
}
