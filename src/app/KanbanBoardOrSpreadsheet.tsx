"use client";

import { useState, Suspense } from 'react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import { Button } from '@/components/ui/button';
import { useBills } from '@/hooks/use-bills';
import KanbanBoardSkeleton from '@/components/kanban/skeletons/skeleton-board';
import { cn } from '@/lib/utils';
import { GridSpreadsheetSkeleton, SpreadsheetSkeleton } from '@/components/kanban/skeletons/skeleton-spreadsheet';

interface KanbanBoardOrSpreadsheetProps {
  view: 'kanban' | 'spreadsheet'
}
export function KanbanBoardOrSpreadsheet({ view }: KanbanBoardOrSpreadsheetProps) {  
  const { bills, loading } = useBills()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">
        { loading ? (
          <>
            {view === 'kanban' ? (
              <KanbanBoardSkeleton />
            ) : (
              <GridSpreadsheetSkeleton rows={6} columns={4} />
            )}
          </>
        ): (
          <>        
            {view === 'kanban' ? (
              <KanbanBoard initialBills={bills} />
            ) : (
              <KanbanSpreadsheet bills={bills} />
            )}
          </>
        )}        
      </main>
    </div>
  );
} 