import { DoctorRxDetailView } from "../_components/DoctorRxDetailView";

// DocRxDetail (B7): one prescription with reprint, edit and prescribe again.
export default async function DocRxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorRxDetailView prescriptionId={id} />;
}
