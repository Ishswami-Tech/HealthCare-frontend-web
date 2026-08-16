"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n/context";
import { cn, translateSidebarLinks } from "@/lib/utils";
import { SidebarLink } from "@/lib/config/sidebarLinks";

function isMobileSidebarLinkActive(
  currentPathname: string,
  currentSearch: URLSearchParams,
  href: string
): boolean {
  const [targetPath = "/", queryString = ""] = href.split("?");
  const normalizedPath = currentPathname.replace(/\/+$/, "") || "/";
  const normalizedTarget = targetPath.replace(/\/+$/, "") || "/";

  const pathMatches =
    normalizedPath === normalizedTarget ||
    normalizedPath.startsWith(`${normalizedTarget}/`);

  if (!pathMatches) return false;

  if (!queryString) return true;

  const targetParams = new URLSearchParams(queryString);
  for (const [key, value] of targetParams.entries()) {
    if (currentSearch.get(key) !== value) {
      return false;
    }
  }

  return true;
}

interface MobileBottomBarProps {
  links: SidebarLink[];
}

export function MobileBottomBar({ links }: MobileBottomBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();

  const translatedLinks = useMemo(() => translateSidebarLinks(links, t), [links, t]);
  const visibleLinks = useMemo(() => translatedLinks.slice(0, 4), [translatedLinks]);
  const hasMoreItems = translatedLinks.length > visibleLinks.length;
  const columnCount = hasMoreItems ? visibleLinks.length + 1 : visibleLinks.length;
  const currentSearch = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  if (translatedLinks.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile dashboard navigation"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
    >
      <div className="border-t border-border/70 bg-background/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div
          className="grid items-stretch gap-1 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {visibleLinks.map((link) => {
            const Icon = link.icon || Menu;
            const isActive = isMobileSidebarLinkActive(pathname, currentSearch, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 min-h-11 text-[10px] font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span className="whitespace-nowrap text-center leading-none">
                  {link.title}
                </span>
              </Link>
            );
          })}

          {hasMoreItems ? (
            <button
              type="button"
              onClick={() => setOpenMobile(true)}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 min-h-11 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-4.5 shrink-0" />
              <span className="whitespace-nowrap text-center leading-none">More</span>
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
