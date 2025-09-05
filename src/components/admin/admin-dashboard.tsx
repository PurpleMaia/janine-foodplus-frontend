'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  requested_admin: boolean;
  account_status: string;
}

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/admin/pending-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }

      const data = await response.json();
      if (data.success && data.pendingAccountRequests) {
        setPendingUsers(data.pendingAccountRequests);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pending requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Handle approving user
  const handleApproveUser = async (userId: string) => {
    console.log('Approving user with ID:', userId);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIDtoApprove: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      toast({
        title: 'Success',
        description: 'User has been approved',
      });

      // Refresh the pending requests
      fetchPendingRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive',
      });
    }
  };

  // Handle denying user
  const handleDenyUser = async (userId: string) => {
    console.log('Denying user with ID:', userId);
    try {
      const response = await fetch('/api/admin/deny-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIDToDeny: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to deny user');
      }

      toast({
        title: 'Success',
        description: 'User has been denied an account',
      });

      // Refresh the pending requests
      fetchPendingRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deny user',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Account Requests</h1>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No pending account requests
              </p>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </Badge>
                      {user.requested_admin && (
                        <Badge variant="secondary">Requested Admin Access</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button
                      onClick={() => handleApproveUser(user.id)}
                      variant="default"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDenyUser(user.id)}
                      variant="outline"
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}