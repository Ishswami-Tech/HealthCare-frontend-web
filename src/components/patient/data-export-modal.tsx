"use client";

import type * as React from "react";
import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

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

interface DataExportModalProps {
  dataType: "profile" | "medical-records" | "prescriptions";
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DataExportModal({
  dataType,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: DataExportModalProps) {
  const [open, setOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const handleOpenChange = onOpenChange || setOpen;

  const getDataTypeName = () => {
    switch (dataType) {
      case "profile":
        return "Profile Data";
      case "medical-records":
        return "Medical Records";
      case "prescriptions":
        return "Prescriptions";
      default:
        return "Data";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" />
            Export {getDataTypeName()}
          </DialogTitle>
          <DialogDescription>
            Download your {getDataTypeName().toLowerCase()} in your preferred
            format
          </DialogDescription>
        </DialogHeader>

        <div className="gap-y-4 py-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">
              Data export is not connected in this build. Use the profile page
              actions only after the backend export endpoint is enabled.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DataExportModal };
