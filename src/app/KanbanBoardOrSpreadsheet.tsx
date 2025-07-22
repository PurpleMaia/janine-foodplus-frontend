"use client";

import { useState, Suspense } from 'react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import { Button } from '@/components/ui/button';

export function KanbanBoardOrSpreadsheet({ initialBills }: { initialBills: any }) {
  const [view, setView] = useState<'kanban' | 'spreadsheet'>('kanban');

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <KanbanHeader />
      <div className="flex items-center gap-2 p-4 border-b bg-background">
        <Button
          variant={view === 'kanban' ? 'default' : 'outline'}
          onClick={() => setView('kanban')}
        >
          Kanban View
        </Button>
        <Button
          variant={view === 'spreadsheet' ? 'default' : 'outline'}
          onClick={() => setView('spreadsheet')}
        >
          Spreadsheet View
        </Button>
      </div>
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-4">Loading board...</div>}>
          {view === 'kanban' ? (
            <KanbanBoard initialBills={initialBills} />
          ) : (
            <KanbanSpreadsheet bills={initialBills} />
          )}
        </Suspense>
      </main>
    </div>
  );
} 