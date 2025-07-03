import { KanbanBoard } from '@/components/kanban/kanban-board';
import { getAllBills } from '@/services/legislation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';
import { KanbanHeader } from '@/components/kanban/kanban-header';

export default async function Home() {
  // Fetch initial data on the server
  const initialBills = await getAllBills();

  //make a toggle here, and display spreadsheet component or Kanban component

  return (
    <div className="flex h-screen flex-col overflow-hidden">
       <KanbanHeader />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-4">Loading board...</div>}>
          <KanbanBoard initialBills={initialBills} />
        </Suspense>
      </main>
    </div>
  );
}
