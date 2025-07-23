'use client'; // Keep header client-side for search input interaction

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { Button } from '../ui/button';
import { LLMUpdateDialog } from '../llm/llm-update-dialog';

export function KanbanHeader() {
  const { setSearchQuery } = useKanbanBoard(); // Access context
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false); // State for dialog visibility

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between px-4">
      <h1 className="text-xl font-semibold">Legislation Tracker</h1>
      
      <div className='flex gap-2'>        
        <div className="relative ml-auto w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bills..."
            className="w-full rounded-md bg-muted pl-9 pr-4 focus:bg-background"
            onChange={handleSearchChange}
            aria-label="Search bills"
          />
        </div>
      </div>
    </header>
  );
}
