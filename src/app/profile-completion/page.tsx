import { Suspense } from "react";
import ProfileCompletionContent from "./ProfileCompletionContent";

export default function ProfileCompletionPage() {
  return (
    <Suspense fallback={<div>Loading profile completion...</div>}>
      <ProfileCompletionContent />
    </Suspense>
  );
}
