import type { Metadata } from "next";

export const metadata: Metadata = { title: "Live queue" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
