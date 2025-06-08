"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { useQuery } from "@tanstack/react-query";
import { Role } from "@/types/auth.types";

interface Clinic {
  id: string;
  name: string;
  location: string;
  doctorsCount: number;
  patientsCount: number;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinicId: string;
}

export default function SuperAdminDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Fetch clinics data
  const { data: clinicsData } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const response = await fetch("/api/clinics");
      if (!response.ok) throw new Error("Failed to fetch clinics");
      return response.json();
    },
  });

  // Fetch doctors data
  const { data: doctorsData } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const response = await fetch("/api/doctors");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      return response.json();
    },
  });

  useEffect(() => {
    if (clinicsData) {
      setClinics(clinicsData);
    }
    if (doctorsData) {
      setDoctors(doctorsData);
    }
  }, [clinicsData, doctorsData]);

  const totalDoctors = doctors.length;
  const totalPatients = clinics.reduce(
    (sum, clinic) => sum + clinic.patientsCount,
    0
  );
  const totalClinics = clinics.length;

  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      allowedRole={Role.SUPER_ADMIN}
    >
      <DashboardCard
        title="System Statistics"
        stats={[
          { label: "Total Clinics", value: totalClinics },
          { label: "Total Doctors", value: totalDoctors },
          { label: "Total Patients", value: totalPatients },
        ]}
      />

      <DashboardCard title="Clinics Overview">
        <div className="space-y-4">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{clinic.name}</h3>
              <p className="text-gray-600">Location: {clinic.location}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Doctors: {clinic.doctorsCount}</div>
                <div>Patients: {clinic.patientsCount}</div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="System Management">
        <div className="space-y-4">
          <ActionButton label="Manage Clinics" variant="blue" />
          <ActionButton label="System Settings" variant="green" />
          <ActionButton label="User Management" variant="purple" />
          <ActionButton label="View Reports" variant="yellow" />
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Doctors">
        <div className="space-y-4">
          {doctors.slice(0, 5).map((doctor) => (
            <div key={doctor.id} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">{doctor.name}</h3>
              <p className="text-gray-600">{doctor.specialization}</p>
              <p className="text-sm text-gray-500">
                Clinic:{" "}
                {clinics.find((c) => c.id === doctor.clinicId)?.name ||
                  "Unknown"}
              </p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
