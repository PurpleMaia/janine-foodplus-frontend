'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { RequestAdminAccessButton } from '../admin/request-admin-access';
import { useEffect, useState } from 'react';

export function UserMenu() {
  //gets user info and logout function from context 
  const { user, logout } = useAuth();
  const { setView } = useKanbanBoard();

  const [loading, setLoading] = useState<boolean>(false);
  const [adminRequested, setAdminRequested] = useState<boolean>(false); 

  const handleAdminRequestChange = (requested: boolean) => {
    setAdminRequested(requested);
  }

  //creates avatar with users first initial
  const handleLogout = async () => {
    setView('kanban'); // Reset view to 'kanban' on logout
    await logout();
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  useEffect(() => { 
    let mounted = true;

    if (!user) {
      // ensure consistent hook behavior across renders
      if (mounted) {
        setAdminRequested(false);
        setLoading(false);
      }
      return;
    }

    const checkAdminStatus = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/check-admin-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          setAdminRequested(data.adminRequested);
        } else {
          console.error('Failed to check admin request status');
        }
      } catch (error) {
        console.error('Error checking admin request status:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdminStatus();

    return () => {
      mounted = false;
    };

  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user ? getInitials(user.username) : ''}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          { loading ? (
            <div>Loading...</div>
          ) : (
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-bold leading-none">{user ? user.username : ''}</p>
              <p className="text-sm font-medium leading-none">{user ? user.email : ''}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </p>

              { user?.role !== 'admin' && (
                <RequestAdminAccessButton
                email={user?.email ?? ''} 
                adminRequested={adminRequested}
                setRequested={handleAdminRequestChange}
                />
            )}
           </div>
          )}
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
