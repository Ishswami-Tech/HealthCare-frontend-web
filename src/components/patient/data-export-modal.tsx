"use client";

import type * as React from "react";
import { useState } from "react";
import { CircleAlert, Download } from "lucide-react";

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
import { IconBox, Note } from "@/components/tbd";

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
          <DialogTitle className="flex items-center gap-3">
            <IconBox icon={Download} size={36} />
            Export {getDataTypeName()}
          </DialogTitle>
          <DialogDescription>Get a copy of your {getDataTypeName().toLowerCase()}.</DialogDescription>
        </DialogHeader>

        <Note tone="amber" icon={CircleAlert}>
          Downloading your data is not available yet. To get a copy now, ask the clinic.
        </Note>

        <DialogFooter>
          <Button type="button" variant="outline" size="md" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DataExportModal };
