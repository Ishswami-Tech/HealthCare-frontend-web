"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { forgotPasswordSchema } from "@/lib/schema";
import type { ForgotPasswordFormData } from "@/types/auth.types";
import useZodForm from "@/hooks/utils/useZodForm";
import { ForgotPasswordView } from "./_components/ForgotPasswordView";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { useAuthForm } from "@/hooks/auth/useAuth";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { ROUTES } from "@/lib/config/routes";

export default function ForgotPasswordPage() {
  const { forgotPassword, isRequestingReset } = useAuth();

  // ✅ Use unified auth form hook for consistent patterns
  const { executeAuthOperation } = useAuthForm({
    toastId: TOAST_IDS.AUTH.FORGOT_PASSWORD,
    loadingMessage: "Sending instructions...",
    successMessage: "Password reset instructions have been sent to your email.",
    errorMessage: ERROR_MESSAGES.FORGOT_PASSWORD_FAILED,
    redirectUrl: ROUTES.LOGIN,
    showToast: true,
  });

  const form = useZodForm(
    forgotPasswordSchema,
    async (data: ForgotPasswordFormData) => {
      // ✅ Use unified pattern - consistent across all auth pages
      await executeAuthOperation(async () => {
        return await forgotPassword(data.email);
      });
    },
    {
      email: "",
    }
  );

  // ✅ Overlay clearing is handled by auth layout - no need to clear here
  // This prevents race conditions and ensures consistent behavior

  return <ForgotPasswordView form={form} isRequestingReset={isRequestingReset} />;
}
