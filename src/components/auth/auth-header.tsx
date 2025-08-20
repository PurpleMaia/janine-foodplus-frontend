'use client';

import { useAuth } from '@/contexts/auth-context';
import { LoginDialog } from './login-dialog';
import { UserMenu } from './user-menu';

export function AuthHeader() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <UserMenu />
      ) : (
        <LoginDialog />
      )}
    </div>
  );
}
