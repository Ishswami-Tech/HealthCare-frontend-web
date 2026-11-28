import { HandoverContent } from "../_components/HandoverContent";

// PhHandover (B10): verify the patient, check the items, record the acknowledgement.
export default async function PhHandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HandoverContent prescriptionId={id} />;
}
