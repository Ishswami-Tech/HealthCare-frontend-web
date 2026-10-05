import type { Metadata } from "next";
import { DietChartEditorContent } from "./_components/DietChartEditorContent";

export const metadata: Metadata = {
  title: "Diet Chart",
};

/** The diet chart of one visit on its own page (same editor as the case-sheet Diet section). */
export default async function DietChartEditorPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>;
}) {
  const { id, visitId } = await params;
  return <DietChartEditorContent patientId={id} visitId={visitId} />;
}
