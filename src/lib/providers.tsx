'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/auth-context';
import { KanbanBoardProvider } from '@/contexts/kanban-board-context';
import { BillsProvider } from '@/contexts/bills-context';
import { queryClient } from '@/lib/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <KanbanBoardProvider>
            <BillsProvider>
              {children}
            </BillsProvider>
          </KanbanBoardProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}