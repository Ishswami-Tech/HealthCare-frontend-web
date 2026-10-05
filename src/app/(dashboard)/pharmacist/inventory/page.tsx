import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The inventory lives at `/pharmacy` (the sidebar target). This older address only forwards
 * there and keeps the query string (`?action=add`, `?filter=low` …).
 */
export default async function PharmacistInventoryRedirect({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry !== undefined) query.append(key, entry);
    }
  }
  const suffix = query.toString();
  redirect(suffix ? `/pharmacy?${suffix}` : "/pharmacy");
}
