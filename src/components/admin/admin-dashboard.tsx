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
  requested_supervisor: boolean;
  account_status: string;
}

interface SupervisorRequest {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface PendingProposal {
  id: string;
  bill_id: string;
  bill_number?: string;
  bill_title?: string;
  proposed_status: string;
  current_status: string;
  proposed_at: string;
  proposing_user_id: string;
  proposing_username?: string;
  proposalId: string;
}

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingProposals, setPendingProposals] = useState<PendingProposal[]>([]);
  const [supervisorRequests, setSupervisorRequests] = useState<SupervisorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isLoadingSupervisor, setIsLoadingSupervisor] = useState(true);
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
      console.error('Error fetching pending requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pending bill proposals
  const fetchPendingProposals = async () => {
    try {
      const response = await fetch('/api/proposals/load');
      if (!response.ok) {
        throw new Error('Failed to fetch pending proposals');
      }
      const data = await response.json();
      if (data.success && data.proposals) {
        setPendingProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching pending proposals:', error);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Fetch pending supervisor requests
  const fetchSupervisorRequests = async () => {
    try {
      const response = await fetch('/api/supervisor/pending-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch supervisor requests');
      }
      const data = await response.json();
      if (data.success && data.requests) {
        setSupervisorRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching supervisor requests:', error);
    } finally {
      setIsLoadingSupervisor(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingProposals();
    fetchSupervisorRequests();
  }, []);

  // Handle approving proposal
  const handleApproveProposal = async (proposalId: string, billId: string) => {
    try {
      const response = await fetch('/api/proposals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve proposal');
      }

      toast({
        title: 'Success',
        description: 'Proposal approved',
      });

      fetchPendingProposals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve proposal',
        variant: 'destructive',
      });
    }
  };

  // Handle rejecting proposal
  const handleRejectProposal = async (proposalId: string) => {
    try {
      const response = await fetch('/api/proposals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject proposal');
      }

      toast({
        title: 'Success',
        description: 'Proposal rejected',
      });

      fetchPendingProposals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject proposal',
        variant: 'destructive',
      });
    }
  };

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
  };

  // Handle approving supervisor request
  const handleApproveSupervisor = async (userId: string) => {
    try {
      const response = await fetch('/api/supervisor/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve supervisor request');
      }

      toast({
        title: 'Success',
        description: 'Supervisor access granted',
      });

      fetchSupervisorRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve supervisor request',
        variant: 'destructive',
      });
    }
  };

  // Handle rejecting supervisor request
  const handleRejectSupervisor = async (userId: string) => {
    try {
      const response = await fetch('/api/supervisor/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject supervisor request');
      }

      toast({
        title: 'Success',
        description: 'Supervisor request rejected',
      });

      fetchSupervisorRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject supervisor request',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mx-auto p-6">
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Pending Account Requests */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Pending Account Requests</h1>
        <ScrollArea className="h-[400px]">
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

      {/* Pending Supervisor Requests */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Pending Supervisor Requests</h1>
        {isLoadingSupervisor ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {supervisorRequests.length === 0 ? (
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    No pending supervisor requests
                  </p>
                </Card>
              ) : (
                supervisorRequests.map((request) => (
                  <Card key={request.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{request.username}</h3>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <Badge variant="outline">
                          Joined: {new Date(request.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="space-x-2">
                        <Button
                          onClick={() => handleApproveSupervisor(request.id)}
                          variant="default"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectSupervisor(request.id)}
                          variant="outline"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Pending Bill Proposals */}
      <div>
        <h1 className="text-2xl font-bold mb-6">Pending Bill Proposals</h1>
        {isLoadingProposals ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {pendingProposals.length === 0 ? (
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    No pending bill proposals
                  </p>
                </Card>
              ) : (
                pendingProposals.map((proposal) => (
                  <Card key={proposal.proposalId} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{proposal.bill_number || proposal.bill_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {proposal.bill_title || `Bill ID: ${proposal.bill_id}`}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {proposal.current_status} → {proposal.proposed_status}
                          </Badge>
                          <Badge variant="outline">
                            Proposed: {new Date(proposal.proposed_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button
                          onClick={() => handleApproveProposal(proposal.proposalId, proposal.bill_id)}
                          variant="default"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectProposal(proposal.proposalId)}
                          variant="outline"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}