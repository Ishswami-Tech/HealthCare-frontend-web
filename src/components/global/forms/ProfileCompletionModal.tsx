"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProfileCompletionForm from "./ProfileCompletionForm";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ProfileCompletionModal({ isOpen, onClose, onComplete }: ProfileCompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide the required information to finish setting up your account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ProfileCompletionForm onComplete={onComplete} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 