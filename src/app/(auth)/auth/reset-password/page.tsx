"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";

import { resetPasswordSchema } from "@/lib/schema";
import type { ResetPasswordFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/utils/useZodForm";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";
import { ResetLinkInvalidView, ResetPasswordView } from "./_components/ResetPasswordView";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const token = getSearchParam("token");
  const safeToken = token || "";
  const { resetPassword, isResettingPassword } = useAuth();

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.RESET_PASSWORD,
    loadingMessage: "Resetting password...",
    successMessage: "Password has been reset successfully.",
    errorMessage: ERROR_MESSAGES.RESET_PASSWORD_FAILED,
    redirectUrl: ROUTES.LOGIN,
    showToast: true,
  });

  const form = useZodForm(
    resetPasswordSchema,
    async (data: ResetPasswordFormData) => {
      // ✅ Use unified pattern - consistent across all auth pages
      await executeAuthOperation(async () => {
        return await resetPassword({
          token: data.token,
          newPassword: data.password,
        });
      });
    },
    {
      password: "",
      confirmPassword: "",
      token: safeToken,
    }
  );

  if (!safeToken) {
    return <ResetLinkInvalidView />;
  }

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return <ResetPasswordView form={form} isResettingPassword={isResettingPassword} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}


