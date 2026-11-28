import type { ReactNode } from "react";
import Link from "next/link";
import { Construction } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyBlock, PageHead, Surface } from "./primitives";

/**
 * Page shell of the TestByDoctor screens: the title row (`PageHead`) and a column of blocks
 * 20 px apart. The dashboard layout already supplies the sidebar, the 68 px header and the
 * 1160 px content width, so a screen only renders this and its own blocks.
 *
 *   export default function Page() {
 *     return (
 *       <TbdPage title="Invoices" description="All invoices across locations" actions={<Button>New invoice</Button>}>
 *         ...blocks...
 *       </TbdPage>
 *     );
 *   }
 */
export function TbdPage({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-5 pt-1", className)}>
      <PageHead
        title={title}
        {...(description ? { description } : {})}
        {...(actions ? { actions } : {})}
        {...(backHref ? { backHref } : {})}
        {...(backLabel ? { backLabel } : {})}
      />
      {children}
    </div>
  );
}

/**
 * Stand-in body of a route that is registered but not built yet. Every placeholder
 * `page.tsx` is just this component; the batch that builds the screen replaces the
 * whole file with `<TbdPage>` plus its content.
 *
 * `legacyHref` points at the screen that serves the same job today (when there is one).
 */
export function PlaceholderPage({
  title,
  screen,
  batch,
  description,
  backHref,
  backLabel,
  legacyHref,
  legacyLabel = "Open the current screen",
}: {
  title: string;
  /** Design screen name, for example `CaInvoices`. */
  screen: string;
  /** Build batch that replaces this page, for example `B1`. */
  batch: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  legacyHref?: string;
  legacyLabel?: string;
}) {
  return (
    <TbdPage
      title={title}
      {...(description ? { description } : {})}
      {...(backHref ? { backHref } : {})}
      {...(backLabel ? { backLabel } : {})}
    >
      <Surface flush data-screen={screen} data-batch={batch}>
        <EmptyBlock
          icon={Construction}
          tone="amber"
          title={`${title} is being built`}
          description={`This screen (${screen}) is registered and will be available soon.`}
          action={
            legacyHref ? (
              <Link
                href={legacyHref}
                className="inline-flex min-h-10 items-center rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-ink hover:bg-mint-soft"
              >
                {legacyLabel}
              </Link>
            ) : undefined
          }
        />
      </Surface>
    </TbdPage>
  );
}
