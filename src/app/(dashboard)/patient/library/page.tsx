import { Suspense } from "react";
import PatientLibraryContent from "./_components/PatientLibraryContent";

/** /patient/library — Health Library home (the content reads `?tab`, `?q` and `?page`). */
export default function PatientLibraryPage() {
  return (
    <Suspense fallback={null}>
      <PatientLibraryContent />
    </Suspense>
  );
}
