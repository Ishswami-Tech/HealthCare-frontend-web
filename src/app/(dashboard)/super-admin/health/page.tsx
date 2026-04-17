"use client";

import { ComprehensiveHealthDashboard } from '@/components/admin/ComprehensiveHealthDashboard';
import { Role } from '@/types/auth.types';

export default function HealthStatusPage() {
  return (
    
      <div className="p-6">
        <ComprehensiveHealthDashboard />
      </div>
    
  );
}

