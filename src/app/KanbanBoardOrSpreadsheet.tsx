"use client";

import { useState, Suspense } from 'react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import { Button } from '@/components/ui/button';
import { useBills } from '@/hooks/use-bills';

interface KanbanBoardOrSpreadsheetProps {
  view: 'kanban' | 'spreadsheet'
}
export function KanbanBoardOrSpreadsheet({ view }: KanbanBoardOrSpreadsheetProps) {  
  const { bills } = useBills()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-4">Loading board...</div>}>
          {view === 'kanban' ? (
            <KanbanBoard initialBills={bills} />
          ) : (
            <KanbanSpreadsheet bills={bills} />
          )}
        </Suspense>
      </main>
    </div>
  );
} 