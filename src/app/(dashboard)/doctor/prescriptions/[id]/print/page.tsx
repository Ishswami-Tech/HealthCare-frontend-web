import "@/styles/rx-print.css";
import { DoctorRxPrintView } from "../../_components/DoctorRxPrintView";

// DocRxPrint (B7): print preview; only the sheet prints (see styles/rx-print.css).
export default async function DocRxPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorRxPrintView prescriptionId={id} />;
}
