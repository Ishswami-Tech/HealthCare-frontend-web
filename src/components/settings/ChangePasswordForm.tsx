'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, CircleAlert, Eye, EyeOff } from 'lucide-react';
import { Note } from '@/components/tbd';
import { useAuth } from '@/hooks/auth/useAuth';
import { getDashboardByRole } from '@/lib/config/routes';
import { Role } from '@/types/auth.types';

type PasswordField = 'current' | 'new' | 'confirm';

const FIELD_LABEL = 'text-xs font-bold text-ink-soft';

function PasswordInput({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  minLength,
  hint,
  visible,
  disabled,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete: string;
  minLength?: number;
  hint?: string;
  visible: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-11"
          {...(minLength ? { minLength } : {})}
          {...(hint ? { 'aria-describedby': `${id}-hint` } : {})}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="m-0 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const { push } = useRouter();
  const { session, changePasswordAsync, isChangingPassword } = useAuth();
  const user = session?.user;

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<PasswordField, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });

  const toggle = (field: PasswordField) => () =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Keep the form: the event no longer points at it once the request has finished.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const currentPassword = formData.get('currentPassword') as string;

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await changePasswordAsync({
        ...(currentPassword ? { currentPassword } : {}),
        newPassword: newPassword,
      });
      setSuccess(true);
      form.reset();

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        const dashboardRoute = user?.role
          ? getDashboardByRole(user.role as Role)
          : '/';
        push(dashboardRoute);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <PasswordInput
        id="currentPassword"
        name="currentPassword"
        label="Current Password"
        autoComplete="current-password"
        visible={showPasswords.current}
        disabled={isChangingPassword}
        onToggle={toggle('current')}
      />

      <PasswordInput
        id="newPassword"
        name="newPassword"
        label="New Password"
        placeholder="Enter a new password"
        autoComplete="new-password"
        minLength={8}
        hint="Must be at least 8 characters long"
        visible={showPasswords.new}
        disabled={isChangingPassword}
        onToggle={toggle('new')}
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm New Password"
        placeholder="Re-enter the new password"
        autoComplete="new-password"
        visible={showPasswords.confirm}
        disabled={isChangingPassword}
        onToggle={toggle('confirm')}
      />

      {error && (
        <Note tone="rose" icon={CircleAlert}>
          <span role="alert">{error}</span>
        </Note>
      )}

      {success && (
        <Note tone="green" icon={CheckCircle2}>
          <span role="status">Password changed successfully! Redirecting…</span>
        </Note>
      )}

      <div>
        <Button type="submit" size="md" disabled={isChangingPassword} className="w-full sm:w-auto">
          {isChangingPassword ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Changing Password…
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>
    </form>
  );
}
