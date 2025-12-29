"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComprehensiveHealthDashboard } from './ComprehensiveHealthDashboard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GlobalHealthStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalHealthStatusModal({
  open,
  onOpenChange,
}: GlobalHealthStatusModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">System Health Status</DialogTitle>
          <DialogDescription>
            Real-time monitoring of all backend services and infrastructure
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="px-6 py-4">
            <ComprehensiveHealthDashboard />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

