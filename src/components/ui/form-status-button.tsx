/**
 * React 19 useFormStatus Hook Integration
 * Form submit button with automatic loading state
 */

"use client";

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
// import type { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import React from 'react';

export interface FormStatusButtonProps extends Omit<React.ComponentProps<typeof Button>, 'disabled' | 'type'> {
  /**
   * Custom loading text
   */
  loadingText?: string;
  
  /**
   * Show spinner when pending
   */
  showSpinner?: boolean;
  
  /**
   * Children to display when not pending
   */
  children: React.ReactNode;
}

/**
 * Form submit button that automatically shows loading state
 * Uses React 19's useFormStatus hook
 * 
 * @example
 * ```tsx
 * <form action={submitAction}>
 *   <FormStatusButton>Submit</FormStatusButton>
 * </form>
 * ```
 */
type FormStatusButtonComponentProps = FormStatusButtonProps & {
  ref?: React.Ref<HTMLButtonElement>;
};

export function FormStatusButton({
  loadingText,
  showSpinner = true,
  children,
  className,
  ref,
  ...props
}: FormStatusButtonComponentProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      ref={ref}
      type="submit"
      disabled={pending}
      className={className}
      {...props}
    >
      {pending && showSpinner && (
        <Loader2 className="mr-2 size-4 animate-spin" />
      )}
      {pending ? (loadingText || children) : children}
    </Button>
  );
}

FormStatusButton.displayName = 'FormStatusButton';

/**
 * Form status indicator component
 * Shows form submission status
 */
export function FormStatusIndicator() {
  const { pending } = useFormStatus();
  
  if (!pending) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {pending && (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Submitting…</span>
        </>
      )}
    </div>
  );
}


