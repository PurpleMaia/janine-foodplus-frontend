"use client";

import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { useBills } from '@/hooks/use-bills';
import { Bill } from '@/types/legislation';

interface KanbanBoardOrSpreadsheetProps {
  bills: Bill[]
  view: 'kanban' | 'spreadsheet'

}
export function KanbanBoardOrSpreadsheet({ bills, view }: KanbanBoardOrSpreadsheetProps) {  
  
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