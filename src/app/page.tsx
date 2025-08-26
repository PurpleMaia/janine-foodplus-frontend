'use client'

import { getAllBills } from '@/services/legislation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import AIUpdateButton from '@/components/llm/llm-update-button';
import { ProtectedKanbanBoard } from '@/components/kanban/protected-kanban-board';
import { Button } from '@/components/ui/button';
import NewBillButton from '@/components/new-bill/new-bill-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { useBills } from '@/hooks/use-bills';
import { ProtectedComponent } from '@/components/auth/protected-component';




//Adds login/logout button in top-right
// Protects NewBillButton (only shows when logged in)
// Replaces your old kanban component with protected version


export default function Home() {
  const [view, setView] = useState<'kanban' | 'spreadsheet'>('kanban');
  const { bills } = useBills();
  // const initialBills = await getAllBills();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
        <div className='flex justify-between items-center px-4 border-b py-3 shadow-sm'>
          <div className='w-full'>
            <KanbanHeader />
          </div>
          <div className='flex items-center gap-2'>
            {/* <AIUpdateButton/> */}
            <ProtectedComponent>
              <NewBillButton />
            </ProtectedComponent>
            <AuthHeader />
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
          <ProtectedKanbanBoard view={view} initialBills={bills}/>        
      </main>
    </div>
  );
}
