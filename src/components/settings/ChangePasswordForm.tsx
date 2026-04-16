'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { getDashboardByRole } from '@/lib/config/routes';
import { Role } from '@/types/auth.types';

export function ChangePasswordForm() {
  const router = useRouter();
  const { session, changePasswordAsync, isChangingPassword } = useAuth();
  const user = session?.user;

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
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
      e.currentTarget.reset();
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        const dashboardRoute = user?.role 
          ? getDashboardByRole(user.role as Role) 
          : '/';
        router.push(dashboardRoute);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            required
            autoComplete="current-password"
            disabled={isChangingPassword}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            required
            autoComplete="new-password"
            minLength={8}
            disabled={isChangingPassword}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            required
            autoComplete="new-password"
            disabled={isChangingPassword}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>
            Password changed successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
        {isChangingPassword ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Changing Password...
          </>
        ) : (
          'Change Password'
        )}
      </Button>
    </form>
  );
}
