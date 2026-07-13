import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinic";
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <LoadingSpinner size="lg" center />
      <p className="text-sm font-medium text-muted-foreground">{clinicName}</p>
    </div>
  );
}
