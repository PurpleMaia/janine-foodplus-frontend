'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { KanbanBoard } from './kanban-board';
import { KanbanSpreadsheet } from './kanban-spreadsheet';
import type { Bill } from '@/types/legislation';

interface ProtectedKanbanBoardProps {
  initialBills: Bill[];
  view: 'kanban' | 'spreadsheet';
}

export function ProtectedKanbanBoard({ initialBills, view }: ProtectedKanbanBoardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // If not authenticated, show read-only view
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Public View</h2>
          <p className="text-muted-foreground max-w-md">
            This is a read-only view of the legislation tracker. 
            Login to edit and manage bills.
          </p>
        </div>
        {view === 'kanban' ? (
          <KanbanBoard initialBills={initialBills} readOnly={true} />
        ) : (
          <KanbanSpreadsheet bills={initialBills} />
        )}
      </div>
    );
  }

  // If authenticated, show full functionality
  return view === 'kanban' ? (
    <KanbanBoard initialBills={initialBills} readOnly={false} />
  ) : (
    <KanbanSpreadsheet bills={initialBills} />
  );
}
