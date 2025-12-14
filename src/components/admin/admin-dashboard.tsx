'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/use-query-admin';
import AdminHeader from './admin-header';

export function AdminDashboard() {
  const {
  // Data
  pendingUsers,
  pendingProposals,
  supervisorRequests,
  allInterns,
  supervisorRelationships,
  allInternBills,

  // Loading states
  isLoading,
  isLoadingProposals,
  isLoadingSupervisor,
  isLoadingInterns,
  isLoadingRelationships,
  isLoadingBills,

  // Actions
  handleApproveProposal,
  handleRejectProposal,
  handleApproveUser,
  handleDenyUser,
  handleApproveSupervisor,
  handleRejectSupervisor,

  // Mutation states
  isApproving,
  isRejecting,
} = useAdminDashboard();

  return (
    <div>
      <Tabs defaultValue="pending-requests" className="w-full">
        <AdminHeader />

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
                          Joined: {user.created_at ? user.created_at.toLocaleDateString() : 'Unknown'}
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
      </TabsContent>          
      </Tabs>
    </div>
  );
}