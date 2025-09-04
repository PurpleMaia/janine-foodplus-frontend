'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';
import { KanbanBoardProvider } from '@/hooks/use-kanban-board';
import { BillsProvider } from '@/contexts/bills-context';
import { queryClient } from '@/lib/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KanbanBoardProvider>
          <BillsProvider>
            {children}
          </BillsProvider>
        </KanbanBoardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}