'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useKanbanBoard } from '@/hooks/use-kanban-board';

export function UserMenu() {
  //gets user info and logout function from context 
  const { user, logout } = useAuth();
  const { setView } = useKanbanBoard();

  //shows nothing if no user (safety check)
  if (!user) return null;

  //creates avatar with users first initial
  const handleLogout = async () => {
    setView('kanban'); // Reset view to 'kanban' on logout
    await logout();
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-bold leading-none">{user.username}</p>
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
