"use client";

import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSpreadsheet } from '@/components/kanban/kanban-spreadsheet';
import { Bill } from '@/types/legislation';

interface KanbanBoardOrSpreadsheetProps {
  view: 'kanban' | 'spreadsheet'

}
export function KanbanBoardOrSpreadsheet({ view }: KanbanBoardOrSpreadsheetProps) {

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">                
            {view === 'kanban' ? (
              <KanbanBoard readOnly={false} />
            ) : (
              <KanbanSpreadsheet />
            )}    
      </main>
    </div>
  );
} 