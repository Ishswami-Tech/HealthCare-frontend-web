import type { Metadata } from "next";
import { baseSEO } from "@/lib/config/seo";

/** Per-route titles come from each segment's `metadata.title`; this adds the site suffix (WCAG 2.4.2). */
export const metadata: Metadata = {
  title: { template: `%s | ${baseSEO.siteName}`, default: baseSEO.siteName },
};

export default function PatientSectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
