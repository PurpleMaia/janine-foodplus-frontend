'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/contexts/auth-context';
import { useTrackedBills } from '@/hooks/use-tracked-bills';
import { UserPlus } from 'lucide-react';
import { UserSelector } from './user-selector';
import { getAssignableUsers } from '@/services/data/legislation';
import { User } from '@/db/types';
import { Selectable } from 'kysely';

interface AssignBillDialogProps {
  billUrl: string;
  billNumber?: string;
  trigger?: React.ReactNode;
}

export function AssignBillDialog({ billUrl, billNumber, trigger }: AssignBillDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<Selectable<User>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { assignBill } = useTrackedBills();

  // Fetch assignable users when dialog opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !user) return;

      setIsFetchingUsers(true);
      try {
        const users = await getAssignableUsers(user.id);
        setAssignableUsers(users);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to load assignable users.',
          variant: 'destructive',
        });
      } finally {
        setIsFetchingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen, user, toast]);

  const handleAssign = async () => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to assign bills.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedUserId) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a user to assign the bill to.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await assignBill(selectedUserId, billUrl);

      if (success) {
        setSelectedUserId(null);
        setIsOpen(false);
      }
    } catch (error) {
      // Error toast is handled in the hook
      console.error('Error assigning bill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4" />
            Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Bill to User</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {billNumber
              ? `Assign ${billNumber} to an intern or supervisor.`
              : 'Assign this bill to an intern or supervisor.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            {isFetchingUsers ? (
              <div className="text-sm text-muted-foreground">Loading users...</div>
            ) : assignableUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No users available to assign bills to.
              </div>
            ) : (
              <UserSelector
                users={assignableUsers}
                selectedUserId={selectedUserId}
                onSelect={setSelectedUserId}
                placeholder="Select a user to assign..."
                disabled={isLoading}
              />
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedUserId(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isLoading || !selectedUserId || isFetchingUsers}
            >
              {isLoading ? 'Assigning...' : 'Assign Bill'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
