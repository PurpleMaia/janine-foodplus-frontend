'use client'; // Keep header client-side for search input interaction

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { useAuth } from '@/contexts/auth-context';
// import { TagFilterList } from '../tags/tag-filter-list';
import { AuthHeader } from '../auth/auth-header';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { User } from '@/types/users';

interface KanbanHeaderProps {
  user: User | undefined;
}

export function KanbanHeader({ user }: KanbanHeaderProps) {
  const { setSearchQuery, selectedTagIds, setSelectedTagIds } = useKanbanBoard(); // Access context

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
      <header className="sticky top-0 z-10 flex items-center px-8 py-4 border-b shadow-lg bg-white ">
        {/* Info */}
        <div className="flex-shrink-0">
          {/* FOOD+ LOGO HERE */}
          <h1 className="text-xl font-semibold">Food+ Bill Tracker</h1>
          <h2 className="text-sm font-light text-gray-500">Track and manage bills</h2>
        </div>

        {/* View Select Bar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center w-fit">
          <ViewBar user={user} />
        </div>
        
        {/* Search and Auth */}
        <div className="relative max-w-md flex gap-4 flex-shrink-0 ml-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-md bg-muted pl-9 focus:bg-background shadow-sm"
            onChange={handleSearchChange}
            aria-label="Search bills"
          />
          <AuthHeader />
        </div>
      </header>
    </>
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

function ViewBar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') ?? 'kanban';

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);

    router.replace(`/?${params.toString()}`, {
      scroll: false,
    });
  };
  
  const publicViews = ['kanban', 'spreadsheet'];
  const adminViews = ['admin', 'supervisor'];

  const role = user?.role;
  const views = role === 'admin' || role === 'supervisor'
    ? [...publicViews, ...adminViews]
    : publicViews;

  return (
    <Tabs value={currentView} onValueChange={setView} className='border rounded-md shadow-sm'>
      <TabsList>
        {views.map(v => (
          <TabsTrigger key={v} value={v}
            className='data-[state=active]:bg-accent data-[state=active]:text-white'
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}