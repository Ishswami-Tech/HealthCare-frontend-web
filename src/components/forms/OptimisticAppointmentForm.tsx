/**
 * Example: Appointment Form with React 19 useOptimistic
 * Demonstrates optimistic UI updates for better UX
 */

"use client";

import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormStatusButton } from '@/components/ui/form-status-button';
import { CardSuspense } from '@/components/ui/suspense-boundary';
import { useState } from 'react';

interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
}

export function OptimisticAppointmentForm({ clinicId }: { clinicId: string }) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'CONSULTATION',
  });

  // Use optimistic mutation hook
  const { optimisticData, addOptimistic, mutation, isPending } = useCreateAppointment(clinicId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Optimistic update happens automatically in the hook
    mutation.mutate(formData as any, {
      onSuccess: () => {
        // Reset form on success
        setFormData({
          patientId: '',
          doctorId: '',
          date: '',
          time: '',
          type: 'CONSULTATION',
        });
      },
    });
  };

  return (
    <CardSuspense>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Patient ID"
          value={formData.patientId}
          onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
          required
        />
        <Input
          placeholder="Doctor ID"
          value={formData.doctorId}
          onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
          required
        />
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <Input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />
        
        {/* Use FormStatusButton for automatic loading state */}
        <FormStatusButton 
          type="submit" 
          disabled={isPending}
          loadingText="Creating appointment..."
        >
          Create Appointment
        </FormStatusButton>
      </form>
    </CardSuspense>
  );
}

