"use client";

import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { useBills } from '@/hooks/use-bills';

interface KanbanBoardOrSpreadsheetProps {
  view: 'kanban' | 'spreadsheet'
}
export function KanbanBoardOrSpreadsheet({ view }: KanbanBoardOrSpreadsheetProps) {  
  const { bills } = useBills()
  
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">                
            {view === 'kanban' ? (
              <KanbanBoard initialBills={bills} />
            ) : (
              <KanbanSpreadsheet bills={bills} />
            )}    
      </main>
    </div>
  );
} 