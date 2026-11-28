import { notFound } from "next/navigation";
import { SentryExampleClient } from "./SentryExampleClient";

/** Sentry wizard test page: development only. Production builds answer 404. */
export default function SentryExamplePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SentryExampleClient />;
}
