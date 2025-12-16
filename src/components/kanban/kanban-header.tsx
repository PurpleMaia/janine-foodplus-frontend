'use client'; // Keep header client-side for search input interaction

import { Button } from '@/components/ui/button';
import { KanbanSquareIcon, Search, Table, Tag, UserCheck2Icon, Users2Icon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '../ui/switch';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { Label } from '../ui/label';
import { useState } from 'react';
import NewBillButton from './new-bill/new-bill-button';
import { AdoptBillDialog } from './adopt-bill-dialog';
import { useBills } from '@/contexts/bills-context';
import { TagFilterList } from '../tags/tag-filter-list';

export function KanbanHeader() {
  const { user } = useAuth();
  const { viewMode, toggleViewMode } = useBills();
  const { selectedTagIds, setSelectedTagIds } = useKanbanBoard();

  const isPublic = !user;

  const [isNewBillDialogOpen, setIsNewBillDialogOpen] = useState(false);

  return (
    <div className='p-2 border-b bg-white flex items-center justify-between shadow-md'>
      
        <div className='ml-6'>
          {isPublic ? (
            <div className=''>
              <h2 className="text-md font-semibold">Public View</h2>
              <p className="text-sm text-muted-foreground">Login to manage bills</p>
            </div>
          ) : (
            <div className='flex items-center space-x-2'>
              <Switch id='my-bills' checked={viewMode === 'all-bills'} onCheckedChange={toggleViewMode}> View All Bills</Switch>
              <Label htmlFor='my-bills' className='text-md'>All Tracked Bills</Label>
            </div>
          )}
        </div>

        <div className='flex items-center space-x-2 mr-4 py-2'>            

            <TagFilterList
              selectedTagIds={selectedTagIds}
              onTagToggle={(tagId: string) => {
                setSelectedTagIds((prev) =>
                  prev.includes(tagId)
                    ? prev.filter((id) => id !== tagId)
                    : [...prev, tagId]
                );
              }}
              onClearFilters={() => setSelectedTagIds([])}
            />

            {!isPublic && (
              <>
                <AdoptBillDialog />                
              </>
            )}
        </div>

    </div>
  );
}