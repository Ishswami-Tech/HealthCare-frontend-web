import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lab booking" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
