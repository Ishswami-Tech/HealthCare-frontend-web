import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getServerSession } from "@/lib/actions/auth.server";
import { clinicApiClient } from "@/lib/api/client";
import { queryClientConfig } from "@/hooks/query/config";
import { getAppointmentQueryKey } from "@/lib/query/appointment-query-keys";
import { getQueueListQueryKey } from "@/lib/queue/queue-cache";
import { API_ENDPOINTS } from "@/lib/config/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function buildDashboardHydrationState() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return dehydrate(new QueryClient({ defaultOptions: queryClientConfig.defaultOptions }));
  }

  const user = session.user as {
    id: string;
    role?: string;
    clinicId?: string;
    primaryClinicId?: string;
  };
  const clinicId = user.clinicId || user.primaryClinicId || "";
  const role = String(user.role || "").toUpperCase();
  const queryClient = new QueryClient({ defaultOptions: queryClientConfig.defaultOptions });

  const tasks: Promise<unknown>[] = [
    queryClient.prefetchQuery({
      queryKey: ["userProfile"],
      queryFn: async () => (await clinicApiClient.getProfile()).data,
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ["session"],
      queryFn: async () => session,
      staleTime: 5 * 60 * 1000,
    }),
  ];

  if (role === "PATIENT") {
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ["patientDashboardSummary", user.id, clinicId],
        queryFn: async () => (await clinicApiClient.getPatientDashboardSummary()).data,
        staleTime: 60 * 1000,
      })
    );
  }

  if (clinicId && ["DOCTOR", "ASSISTANT_DOCTOR", "COUNSELOR", "THERAPIST"].includes(role)) {
    const historyStartDate = new Date();
    historyStartDate.setDate(historyStartDate.getDate() - 90);
    const futureEndDate = new Date();
    futureEndDate.setDate(futureEndDate.getDate() + 365);
    const appointmentFilters = {
      clinicId,
      doctorId: user.id,
      startDate: historyStartDate.toISOString().slice(0, 10),
      endDate: futureEndDate.toISOString().slice(0, 10),
      limit: 500,
    };

    tasks.push(
      queryClient.prefetchQuery({
        queryKey: getAppointmentQueryKey(clinicId, appointmentFilters),
        queryFn: async () => (await clinicApiClient.getAppointments(appointmentFilters)).data,
        staleTime: 30 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: getQueueListQueryKey(clinicId, { doctorId: user.id }),
        queryFn: async () => (await clinicApiClient.get(API_ENDPOINTS.QUEUE.GET, { doctorId: user.id })).data,
        staleTime: 15 * 1000,
      })
    );
  }

  if (clinicId && ["RECEPTIONIST", "CLINIC_LOCATION_HEAD"].includes(role)) {
    const historyStartDate = new Date();
    historyStartDate.setDate(historyStartDate.getDate() - 90);
    const futureEndDate = new Date();
    futureEndDate.setDate(futureEndDate.getDate() + 365);
    const appointmentFilters = {
      clinicId,
      startDate: historyStartDate.toISOString().slice(0, 10),
      endDate: futureEndDate.toISOString().slice(0, 10),
      limit: 200,
    };

    tasks.push(
      queryClient.prefetchQuery({
        queryKey: getAppointmentQueryKey(clinicId, appointmentFilters),
        queryFn: async () => (await clinicApiClient.getAppointments(appointmentFilters)).data,
        staleTime: 30 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: getQueueListQueryKey(clinicId),
        queryFn: async () => (await clinicApiClient.get(API_ENDPOINTS.QUEUE.GET, { clinicId })).data,
        staleTime: 15 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ["queue-filters"],
        queryFn: async () => (await clinicApiClient.get(API_ENDPOINTS.QUEUE.FILTERS)).data,
        staleTime: 30 * 60 * 1000,
      })
    );
  }

  await Promise.allSettled(tasks);
  return dehydrate(queryClient);
}

export default async function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dehydratedState = await buildDashboardHydrationState();

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardLayout>{children}</DashboardLayout>
    </HydrationBoundary>
  );
}
