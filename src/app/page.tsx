'use client'

import { getAllBills } from '@/services/legislation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import AIUpdateButton from '@/components/llm/llm-update-button';
import { KanbanBoardOrSpreadsheet } from './KanbanBoardOrSpreadsheet';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [view, setView] = useState<'kanban' | 'spreadsheet'>('kanban');
  // const initialBills = await getAllBills();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
        <div className='flex justify-between items-center px-4 border-b py-3 shadow-sm'>
          <div className='w-full'>
            <KanbanHeader />
          </div>
          {/* Taking this out temporarily, need a better fix at scale */}
          {/* <div className=''>
            <AIUpdateButton/>
          </div> */}
          <div>
            
          </div>
        </div>
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
          <KanbanBoardOrSpreadsheet view={view}/>        
      </main>
    </div>
  );
}
