'use client'; // Keep header client-side for search input interaction

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { useBills } from '@/contexts/bills-context';
import { useAuth } from '@/contexts/auth-context';
import { TagFilterList } from '../tags/tag-filter-list';

export function KanbanHeader() {
  const { setSearchQuery, selectedTagIds, setSelectedTagIds } = useKanbanBoard(); // Access context
  const { viewMode, toggleViewMode } = useBills();
  const { user } = useAuth();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value

    setSearchQuery(query);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between px-4">
        <div>
          <h1 className="text-xl font-semibold">Legislation Tracker</h1>
          <h2 className="text-sm font-light">Track and manage bills effectively</h2>
        </div>
        
        <div className='flex gap-2 items-center'>        
          {user && (
            <Button
              variant={viewMode === 'my-bills' ? 'default' : 'outline'}
              size="sm"
              onClick={toggleViewMode}
              className="whitespace-nowrap"
            >
              {viewMode === 'my-bills' ? 'My Bills' : 'All Bills'}
            </Button>
          )}
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
      <div className="border-b bg-muted/30">
        <TagFilterList
          selectedTagIds={selectedTagIds || []}
          onTagToggle={handleTagToggle}
          onClearFilters={handleClearFilters}
        />
      </div>
    </>
  );
}
