'use client';

import { useAuth } from '@/hooks/contexts/auth-context';
import { ReactNode } from 'react';

interface ProtectedApprovalsComponentProps {
  children: ReactNode;
}

export function ProtectedApprovalsComponent({ children }: ProtectedApprovalsComponentProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Only show for admins and supervisors
  if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
    return null;
  }

  return <>{children}</>;
}
