// components/admin/admin-dashboard-client.tsx
'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
// import {
//   approveUser,
//   denyUser,
//   approveSupervisorRequest,
//   rejectSupervisorRequest,
//   approveProposal,
//   rejectProposal,
//   getAllInterns,
//   getSupervisorRelationships,
//   getAllInternBills,
// } from '@/services/actions/admin';
import type { User } from '@/types/users';
import { PendingProposal, PendingSupervisor, PendingUser } from '@/types/admin';

interface AdminDashboardClientProps {
  initialData: {
    pendingUsers: PendingUser[];
    pendingProposals: PendingProposal[];
    supervisorRequests: PendingSupervisor[];
  };
  user: User;
}

export function AdminDashboardClient({ initialData, user }: AdminDashboardClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Initial tab data (already loaded)
  const [pendingUsers, setPendingUsers] = useState(initialData.pendingUsers);
  const [pendingProposals, setPendingProposals] = useState(initialData.pendingProposals);
  const [supervisorRequests, setSupervisorRequests] = useState(initialData.supervisorRequests);
  
  // Lazy-loaded tab data
  const [interns, setInterns] = useState<any[] | null>(null);
  const [relationships, setRelationships] = useState<any[] | null>(null);
  const [bills, setBills] = useState<any[] | null>(null);
  
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['pending-requests']));

  // Lazy load tab data when tab is first accessed
  // const handleTabChange = async (value: string) => {
  //   if (loadedTabs.has(value)) return;

  //   startTransition(async () => {
  //     try {
  //       if (value === 'all-interns' && !interns) {
  //         const result = await getAllInterns();
  //         if (result.success) setInterns(result.data);
  //       }
        
  //       if (value === 'supervisor-relationships' && !relationships) {
  //         const result = await getSupervisorRelationships();
  //         if (result.success) setRelationships(result.data);
  //       }
        
  //       if (value === 'all-bills' && !bills) {
  //         const result = await getAllInternBills();
  //         if (result.success) setBills(result.data);
  //       }
        
  //       setLoadedTabs(prev => new Set([...prev, value]));
  //     } catch (error) {
  //       toast({
  //         title: 'Error',
  //         description: 'Failed to load data',
  //         variant: 'destructive',
  //       });
  //     }
  //   });
  // };

  // ============ Action Handlers ============
  
  // const handleApproveUser = async (userId: string) => {
  //   startTransition(async () => {
  //     const result = await approveUser({ userId });
      
  //     if (result.success) {
  //       // setPendingUsers(prev => prev.filter(u => u.id !== userId));
  //       toast({ title: 'User approved' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  // const handleDenyUser = async (userId: string) => {
  //   startTransition(async () => {
  //     const result = await denyUser({ userId });
      
  //     if (result.success) {
  //       // setPendingUsers(prev => prev.filter(u => u.id !== userId));
  //       toast({ title: 'User denied' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  // const handleApproveSupervisor = async (userId: string) => {
  //   startTransition(async () => {
  //     const result = await approveSupervisorRequest({ userId });
      
  //     if (result.success) {
  //       // setSupervisorRequests(prev => prev.filter(r => r.id !== userId));
  //       toast({ title: 'Supervisor access granted' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  // const handleRejectSupervisor = async (userId: string) => {
  //   startTransition(async () => {
  //     const result = await rejectSupervisorRequest({ userId });
      
  //     if (result.success) {
  //       // setSupervisorRequests(prev => prev.filter(r => r.id !== userId));
  //       toast({ title: 'Supervisor request rejected' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  // const handleApproveProposal = async (proposalId: string) => {
  //   startTransition(async () => {
  //     const result = await approveProposal({ proposalId });
      
  //     if (result.success) {
  //       setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
  //       toast({ title: 'Proposal approved' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  // const handleRejectProposal = async (proposalId: string) => {
  //   startTransition(async () => {
  //     const result = await rejectProposal({ proposalId });
      
  //     if (result.success) {
  //       setPendingProposals(prev => prev.filter(p => p.id !== proposalId));
  //       toast({ title: 'Proposal rejected' });
  //     } else {
  //       toast({ title: 'Error', description: result.error, variant: 'destructive' });
  //     }
  //   });
  // };

  return (
    <div className="container mx-auto p-6">
      <Tabs 
        defaultValue="pending-requests" 
        className="w-full"
        // onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending-requests" className='data-[state=active]:bg-background data-[state=active]:text-foreground'>
            Pending Requests
            {/* {pendingUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingUsers.length}</Badge>
            )} */}
          </TabsTrigger>
          <TabsTrigger value="all-interns" className='data-[state=active]:bg-background data-[state=active]:text-foreground'>All Interns</TabsTrigger>
          <TabsTrigger value="supervisor-relationships" className='data-[state=active]:bg-background data-[state=active]:text-black'>Supervisors</TabsTrigger>
          <TabsTrigger value="all-bills" className='data-[state=active]:bg-background data-[state=active]:text-black'>All Bills</TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab - Already loaded */}
        <TabsContent value="pending-requests" className="space-y-8 mt-6">
          <PendingUsersSection
            users={pendingUsers}
            // onApprove={handleApproveUser}
            // onDeny={handleDenyUser}
            isPending={isPending}
          />
          
          <SupervisorRequestsSection
            requests={supervisorRequests}
            // onApprove={handleApproveSupervisor}
            // onReject={handleRejectSupervisor}
            isPending={isPending}
          />
          
          <PendingProposalsSection
            proposals={pendingProposals}
            // onApprove={handleApproveProposal}
            // onReject={handleRejectProposal}
            isPending={isPending}
          />
        </TabsContent>

        {/* All Interns Tab - Lazy loaded */}
        <TabsContent value="all-interns" className="mt-6">
          {interns === null ? (
            <LoadingSkeleton />
          ) : (
            <InternsSection interns={interns} />
          )}
        </TabsContent>

        {/* Supervisor Relationships Tab - Lazy loaded */}
        <TabsContent value="supervisor-relationships" className="mt-6">
          {relationships === null ? (
            <LoadingSkeleton />
          ) : (
            <RelationshipsSection relationships={relationships} />
          )}
        </TabsContent>

        {/* All Bills Tab - Lazy loaded */}
        <TabsContent value="all-bills" className="mt-6">
          {bills === null ? (
            <LoadingSkeleton />
          ) : (
            <BillsSection bills={bills} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Sub-components ============

function LoadingSkeleton() {
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

function PendingUsersSection({ 
  users, 
  // onApprove, 
  // onDeny, 
  isPending 
}: { 
  users: PendingUser[]; 
  // onApprove: (id: string) => void; 
  // onDeny: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Account Requests</h2>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No pending account requests
              </p>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Joined: {user.created_at?.toLocaleDateString()}
                      </Badge>
                      {user.requested_admin && (
                        <Badge variant="secondary">Requested Admin</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-x-2">
                    {/* <Button
                      onClick={() => onApprove(user.id)}
                      disabled={isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => onDeny(user.id)}
                      variant="outline"
                      disabled={isPending}
                    >
                      Deny
                    </Button> */}
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

function SupervisorRequestsSection({
  requests = [],
  // onApprove,
  // onReject,
  isPending,
}: {
  requests: PendingSupervisor[];
  // onApprove: (id: string) => void;
  // onReject: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Supervisor Requests</h2>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No pending supervisor requests
              </p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{request.username}</h3>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <Badge variant="outline">
                      Joined: {request.created_at?.toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="space-x-2">
                    {/* <Button onClick={() => onApprove(request.id)} disabled={isPending}>
                      Approve
                    </Button>
                    <Button
                      onClick={() => onReject(request.id)}
                      variant="outline"
                      disabled={isPending}
                    >
                      Reject
                    </Button> */}
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

function PendingProposalsSection({
  proposals,
  // onApprove,
  // onReject,
  isPending,
}: {
  proposals: PendingProposal[];
  // onApprove: (id: string) => void;
  // onReject: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Bill Proposals</h2>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No pending bill proposals
              </p>
            </Card>
          ) : (
            proposals.map((proposal) => (
              <Card key={proposal.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {proposal.bill_number || proposal.bill_id}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {proposal.bill_title || `Bill ID: ${proposal.bill_id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested by {proposal.proposer.username || proposal.proposer?.email || 'Unknown'}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {proposal.current_status} → {proposal.proposed_status}
                      </Badge>
                      <Badge variant="outline">
                        {proposal.created_at?.toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-x-2">
                    {/* <Button onClick={() => onApprove(proposal.id)} disabled={isPending}>
                      Approve
                    </Button>
                    <Button
                      onClick={() => onReject(proposal.id)}
                      variant="outline"
                      disabled={isPending}
                    >
                      Reject
                    </Button> */}
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

function InternsSection({ interns }: { interns: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Interns ({interns.length})</h2>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {interns.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No interns found</p>
            </Card>
          ) : (
            interns.map((intern) => (
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
                        {intern.supervisor ? (
                          <Badge variant="secondary">
                            Supervisor: {intern.supervisor.username}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Supervisor</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {intern.adopted_bills?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">
                        Bills ({intern.adopted_bills.length}):
                      </p>
                      <div className="space-y-1">
                        {intern.adopted_bills.map((adoption: any) => (
                          <div key={adoption.bill.id} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{adoption.bill.bill_number}</Badge>
                            <span className="text-muted-foreground truncate">
                              {adoption.bill.bill_title}
                            </span>
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
    </div>
  );
}

function RelationshipsSection({ relationships }: { relationships: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Supervisor Relationships</h2>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {relationships.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No supervisor relationships
              </p>
            </Card>
          ) : (
            relationships.map((supervisor) => (
              <Card key={supervisor.id} className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">{supervisor.username}</h3>
                  <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                  <Badge variant="secondary">
                    {supervisor.supervised_interns.length} intern(s)
                  </Badge>
                  {supervisor.supervised_interns.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {supervisor.supervised_interns.map((intern: any) => (
                        <div key={intern.id} className="text-sm text-muted-foreground">
                          • {intern.username} ({intern.email})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function BillsSection({ bills }: { bills: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Adopted Bills ({bills.length})</h2>
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {bills.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No bills adopted</p>
            </Card>
          ) : (
            bills.map((bill) => (
              <Card key={bill.id} className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">{bill.bill_number}</h3>
                  <p className="text-sm text-muted-foreground">{bill.bill_title}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{bill.current_status}</Badge>
                    {bill.proposals?.length > 0 && (
                      <Badge variant="destructive">
                        {bill.proposals.length} pending
                      </Badge>
                    )}
                  </div>
                  {bill.adoptions?.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Adopted by: {bill.adoptions.map((a: any) => a.user.username).join(', ')}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}