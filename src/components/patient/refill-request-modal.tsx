"use client";

import type * as React from "react";
import { useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RefillRequestModalProps {
  prescription: {
    id: string;
    medications: Array<{ name: string }>;
  };
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function RefillRequestModal({
  prescription,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: RefillRequestModalProps) {
  const [open, setOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const handleOpenChange = onOpenChange || setOpen;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5" />
            Request Prescription Refill
          </DialogTitle>
          <DialogDescription>
            Request a refill for prescription #{prescription.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-y-4 py-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Medications:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {prescription.medications.map((med) => (
                <li key={med.name}>• {med.name}</li>
              ))}
            </ul>
          </div>

          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">
              Prescription refill requests are not available in this build yet.
              Please contact your clinic directly for refill assistance.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RefillRequestModal };
