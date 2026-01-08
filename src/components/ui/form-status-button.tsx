/**
 * React 19 useFormStatus Hook Integration
 * Form submit button with automatic loading state
 */

"use client";

import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export interface FormStatusButtonProps extends Omit<ButtonProps, 'disabled' | 'type'> {
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
export const FormStatusButton = forwardRef<HTMLButtonElement, FormStatusButtonProps>(
  ({ loadingText, showSpinner = true, children, className, ...props }, ref) => {
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {pending ? (loadingText || children) : children}
      </Button>
    );
  }
);

FormStatusButton.displayName = 'FormStatusButton';

/**
 * Form status indicator component
 * Shows form submission status
 */
export function FormStatusIndicator() {
  const { pending, data, method, action } = useFormStatus();
  
  if (!pending && !data) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {pending && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Submitting...</span>
        </>
      )}
    </div>
  );
}
