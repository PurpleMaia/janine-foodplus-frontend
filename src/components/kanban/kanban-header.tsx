'use client'; // Keep header client-side for search input interaction

import { Button } from '@/components/ui/button';
import { KanbanSquareIcon, Search, Table, Tag, UserCheck2Icon, Users2Icon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '../ui/switch';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { Label } from '../ui/label';
import { useState } from 'react';
import NewBillButton from '../new-bill/new-bill-button';
import { AdoptBillDialog } from './adopt-bill-dialog';

export function KanbanHeader() {
  const { user } = useAuth();
  const {  } = useKanbanBoard();

  const isPublic = !user;

  const [isNewBillDialogOpen, setIsNewBillDialogOpen] = useState(false);

  return (
    <div className='p-2 border-b bg-white flex items-center justify-between shadow-md'>
      
        <div className=''>
          {isPublic ? (
            <div className='ml-6'>
              <h2 className="text-md font-semibold">Public View</h2>
              <p className="text-sm text-muted-foreground">Login to manage bills</p>
            </div>
          ) : (
            <div className='ml-6'>
              <h2 className="text-md font-semibold">Public View</h2>
              <p className="text-sm text-muted-foreground">Login to manage bills</p>
            </div>
          )}
        </div>

        <div className='flex items-center space-x-2 mr-4 py-2'>
            <Button variant="outline"><Tag /><span>Tags</span></Button>

            {!isPublic && (
              <>
                <NewBillButton />
                <AdoptBillDialog />
                <div className='flex items-center space-x-2'>
                  <Switch id='my-bills' checked={true}> View All Bills</Switch>
                  <Label htmlFor='my-bills'>My Bills</Label>
                </div>
              </>
            )}
        </div>

    </div>
  );
}
function TagFilterList({
  selectedTagIds,
  onTagToggle,
  onClearFilters
}: {
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <TagFilterList
      selectedTagIds={selectedTagIds || []}
      onTagToggle={onTagToggle}
      onClearFilters={onClearFilters}
    />
    
  )
}
function MyBillsButton(user: any, viewMode: string, toggleViewMode: () => void) {
  return (
    <>
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
    </>
  );
}

function getIconForView(view: string) {
  switch (view) {
    case 'kanban':
      return <KanbanSquareIcon className="h-5 w-5 mr-2" />;
    case 'spreadsheet':
      return <Table className="h-5 w-5 mr-2" />;
    case 'admin':
      return <UserCheck2Icon className="h-5 w-5 mr-2" />;
      case 'supervisor':
      return <Users2Icon className="h-5 w-5 mr-2" />;
    default:
      return null;
  }
}