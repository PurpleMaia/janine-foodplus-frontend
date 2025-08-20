'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';

interface ProtectedComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedComponent({ children, fallback = null }: ProtectedComponentProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!user) {
    return fallback;
  }

  return <>{children}</>;
}
