import { DocCaseSummaryView } from "@/components/doctor/visit/DocCaseSummaryView";

// DocCaseSummary (B7): case-sheet review before the prescription.
export default async function DocCaseSummaryPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <DocCaseSummaryView appointmentId={appointmentId} />;
}
