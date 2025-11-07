'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface InternWithBills {
  id: string;
  email: string;
  username: string;
  created_at: string;
  account_status: string;
  supervisor_id: string | null;
  supervisor_email: string | null;
  supervisor_username: string | null;
  adopted_bills: Array<{
    bill_id: string;
    bill_number: string;
    bill_title: string;
    current_status: string;
  }>;
}

interface SupervisorRelationship {
  supervisor_id: string;
  supervisor_email: string;
  supervisor_username: string;
  interns: Array<{
    id: string;
    email: string;
    username: string;
    adopted_at: string;
  }>;
}

interface InternBill {
  bill: any;
  adopted_by: Array<{
    intern_id: string;
    intern_email: string;
    intern_username: string;
    supervisor_id: string | null;
    supervisor_email: string | null;
    supervisor_username: string | null;
    adopted_at: string;
  }>;
  pending_proposals: Array<{
    proposal_id: string;
    intern_id: string;
    intern_email: string;
    current_status: string;
    suggested_status: string;
    proposed_at: string;
  }>;
}

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingProposals, setPendingProposals] = useState<PendingProposal[]>([]);
  const [supervisorRequests, setSupervisorRequests] = useState<SupervisorRequest[]>([]);
  const [allInterns, setAllInterns] = useState<InternWithBills[]>([]);
  const [supervisorRelationships, setSupervisorRelationships] = useState<SupervisorRelationship[]>([]);
  const [allInternBills, setAllInternBills] = useState<InternBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isLoadingSupervisor, setIsLoadingSupervisor] = useState(true);
  const [isLoadingInterns, setIsLoadingInterns] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
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
      console.log('📡 Fetching pending proposals for admin...');
      const response = await fetch('/api/proposals/load');
      if (!response.ok) {
        throw new Error('Failed to fetch pending proposals');
      }
      const data = await response.json();
      console.log('📥 Received proposals data:', data);
      if (data.success && data.proposals) {
        console.log(`✅ Setting ${data.proposals.length} pending proposals`);
        setPendingProposals(data.proposals);
      } else {
        console.warn('⚠️  No proposals in response:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching pending proposals:', error);
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

  // Fetch all interns with bills
  const fetchAllInterns = async () => {
    setIsLoadingInterns(true);
    try {
      console.log('📡 [ADMIN] Fetching all interns...');
      const response = await fetch('/api/admin/all-interns');
      console.log('📥 [ADMIN] Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [ADMIN] Failed to fetch all interns:', errorData);
        throw new Error(errorData.error || 'Failed to fetch all interns');
      }
      const data = await response.json();
      console.log('📥 [ADMIN] Received data:', data);
      if (data.success && data.interns) {
        console.log(`✅ [ADMIN] Setting ${data.interns.length} interns`);
        setAllInterns(data.interns);
      } else {
        console.warn('⚠️ [ADMIN] No interns in response:', data);
        setAllInterns([]);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching all interns:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch all interns',
        variant: 'destructive',
      });
      setAllInterns([]);
    } finally {
      setIsLoadingInterns(false);
    }
  };

  // Fetch supervisor relationships
  const fetchSupervisorRelationships = async () => {
    setIsLoadingRelationships(true);
    try {
      const response = await fetch('/api/admin/supervisor-relationships');
      if (!response.ok) {
        throw new Error('Failed to fetch supervisor relationships');
      }
      const data = await response.json();
      if (data.success && data.relationships) {
        setSupervisorRelationships(data.relationships);
      }
    } catch (error) {
      console.error('Error fetching supervisor relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch supervisor relationships',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRelationships(false);
    }
  };

  // Fetch all intern bills
  const fetchAllInternBills = async () => {
    setIsLoadingBills(true);
    try {
      const response = await fetch('/api/admin/all-intern-bills');
      if (!response.ok) {
        throw new Error('Failed to fetch all intern bills');
      }
      const data = await response.json();
      if (data.success && data.bills) {
        setAllInternBills(data.bills);
      }
    } catch (error) {
      console.error('Error fetching all intern bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch all intern bills',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBills(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingProposals();
    fetchSupervisorRequests();
    // Also fetch the new tab data on initial load
    fetchAllInterns();
    fetchSupervisorRelationships();
    fetchAllInternBills();
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
      fetchAllInternBills();
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
      fetchAllInternBills();
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
    <div className="container mx-auto p-6">
      <Tabs defaultValue="pending-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending-requests">Pending Requests</TabsTrigger>
          <TabsTrigger value="all-interns">All Interns</TabsTrigger>
          <TabsTrigger value="supervisor-relationships">Supervisor Relationships</TabsTrigger>
          <TabsTrigger value="all-bills">All Bills</TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="pending-requests" className="space-y-8 mt-6">
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
        </TabsContent>

        {/* All Interns Tab */}
        <TabsContent value="all-interns" className="mt-6">
          <div>
            <h1 className="text-2xl font-bold mb-6">All Interns</h1>
            <Button onClick={fetchAllInterns} variant="outline" className="mb-4">
              Refresh
            </Button>
            {isLoadingInterns ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {allInterns.length === 0 ? (
                    <Card className="p-6">
                      <p className="text-center text-muted-foreground">
                        No interns found
                      </p>
                    </Card>
                  ) : (
                    allInterns.map((intern) => (
                      <Card key={intern.id} className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{intern.username}</h3>
                              <p className="text-sm text-muted-foreground">{intern.email}</p>
                              <div className="flex gap-2">
                                <Badge variant="outline">
                                  Joined: {new Date(intern.created_at).toLocaleDateString()}
                                </Badge>
                                {intern.supervisor_email ? (
                                  <Badge variant="secondary">
                                    Supervisor: {intern.supervisor_username || intern.supervisor_email}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">No Supervisor</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                              Adopted Bills ({intern.adopted_bills.length}):
                            </p>
                            {intern.adopted_bills.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No bills adopted</p>
                            ) : (
                              <div className="space-y-2">
                                {intern.adopted_bills.map((bill, index) => (
                                  <div key={`${intern.id}-${bill.bill_id}-${index}`} className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">{bill.bill_number}</Badge>
                                    <span className="text-muted-foreground">{bill.bill_title}</span>
                                    <Badge variant="secondary">{bill.current_status}</Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* Supervisor Relationships Tab */}
        <TabsContent value="supervisor-relationships" className="mt-6">
          <div>
            <h1 className="text-2xl font-bold mb-6">Supervisor-Intern Relationships</h1>
            <Button onClick={fetchSupervisorRelationships} variant="outline" className="mb-4">
              Refresh
            </Button>
            {isLoadingRelationships ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {supervisorRelationships.length === 0 ? (
                    <Card className="p-6">
                      <p className="text-center text-muted-foreground">
                        No supervisor relationships found
                      </p>
                    </Card>
                  ) : (
                    supervisorRelationships.map((relationship) => (
                      <Card key={relationship.supervisor_id} className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{relationship.supervisor_username}</h3>
                              <p className="text-sm text-muted-foreground">{relationship.supervisor_email}</p>
                              <Badge variant="secondary">
                                {relationship.interns.length} intern{relationship.interns.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Adopted Interns:</p>
                            {relationship.interns.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No interns adopted</p>
                            ) : (
                              <div className="space-y-2">
                                {relationship.interns.map((intern, index) => (
                                  <div key={`${relationship.supervisor_id}-${intern.id}-${index}`} className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">{intern.username}</Badge>
                                    <span className="text-muted-foreground">{intern.email}</span>
                                    <Badge variant="secondary">
                                      Adopted: {new Date(intern.adopted_at).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        {/* All Bills Tab */}
        <TabsContent value="all-bills" className="mt-6">
          <div>
            <h1 className="text-2xl font-bold mb-6">All Bills Adopted by Interns</h1>
            <Button onClick={fetchAllInternBills} variant="outline" className="mb-4">
              Refresh
            </Button>
            {isLoadingBills ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {allInternBills.length === 0 ? (
                    <Card className="p-6">
                      <p className="text-center text-muted-foreground">
                        No bills adopted by interns
                      </p>
                    </Card>
                  ) : (
                    allInternBills.map((item) => (
                      <Card key={item.bill.id} className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{item.bill.bill_number}</h3>
                              <p className="text-sm text-muted-foreground">{item.bill.bill_title}</p>
                              <div className="flex gap-2">
                                <Badge variant="outline">Status: {item.bill.current_status}</Badge>
                                {item.pending_proposals.length > 0 && (
                                  <Badge variant="destructive">
                                    {item.pending_proposals.length} Pending Proposal{item.pending_proposals.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                              Adopted by ({item.adopted_by.length} intern{item.adopted_by.length !== 1 ? 's' : ''}):
                            </p>
                            <div className="space-y-2">
                              {item.adopted_by.map((adopter, index) => (
                                <div key={`${adopter.intern_id}-${item.bill.id}-${index}`} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline">{adopter.intern_username}</Badge>
                                  <span className="text-muted-foreground">{adopter.intern_email}</span>
                                  {adopter.supervisor_email && (
                                    <Badge variant="secondary">Supervisor: {adopter.supervisor_username || adopter.supervisor_email}</Badge>
                                  )}
                                  <Badge variant="outline">
                                    Adopted: {new Date(adopter.adopted_at).toLocaleDateString()}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                          {item.pending_proposals.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Pending Proposals:</p>
                              <div className="space-y-2">
                                {item.pending_proposals.map((proposal, index) => (
                                  <div key={`${proposal.proposal_id}-${item.bill.id}-${index}`} className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">{proposal.intern_email}</Badge>
                                    <span className="text-muted-foreground">
                                      {proposal.current_status} → {proposal.suggested_status}
                                    </span>
                                    <Badge variant="secondary">
                                      {new Date(proposal.proposed_at).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}