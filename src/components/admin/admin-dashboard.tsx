'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/use-query-admin';
import AdminHeader from './admin-header';
import { InternWithBills, PendingUser } from '@/types/admin';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatBillStatusName } from '@/lib/utils';
import React from 'react';
import { ManageInternDialog } from './manage-intern-dialog';

export function AdminDashboard() {
  const {
  // Data
  pendingUsers,
  pendingProposals,
  supervisorRequests,
  allInterns,
  supervisorRelationships,

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

  const counts = {
    pendingRequests: pendingUsers ? pendingUsers.length : 0,
    allInterns: allInterns ? allInterns.length : 0,
    supervisorRelationships: supervisorRelationships ? supervisorRelationships.length : 0,
    approvals: pendingProposals ? pendingProposals.length : 0,
  };

  return (
    <div>
      <Tabs defaultValue="pending-requests" className="w-full">
        <AdminHeader count={counts} />

        <PendingUsersTab
          pendingUsers={pendingUsers}
          handleApproveUser={handleApproveUser}
          handleDenyUser={handleDenyUser}
        />

        <AllInternsTab
          interns={allInterns}
          // handleApproveUser={handleApproveUser}
          // handleDenyUser={handleDenyUser}
        />


      </Tabs>
    </div>
  );
}

function PendingUsersTab(
  { pendingUsers, handleApproveUser, handleDenyUser }: {
    pendingUsers: PendingUser[];
    handleApproveUser: (userId: string) => void
    handleDenyUser: (userId: string) => void;
  }
) {
  return (
    <TabsContent value="pending-requests" className="mx-8 space-y-8 mt-6">
          {/* Pending Account Requests */}
          <div>
            <h1 className="text-2xl font-bold mb-1 ">Pending Account Requests</h1>
            <h2 className="text-sm mb-6 text-muted-foreground">Review and manage user account requests</h2>
            <ScrollArea className="h-[800px] w-full">
              <div className="space-y-4">
                {pendingUsers.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                      No pending account requests
                    </p>
                  </Card>
                ) : (
                  pendingUsers.map((user) => (
                    <Card key={user.id} className="p-6 bg-white shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{user.username}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground items-center">
                            Joined: <span className='text-foreground'>{user.created_at ? user.created_at.toLocaleDateString() : 'Unknown'}</span> 

                            {user.requested_admin 
                            ? <Badge variant="secondary" className='bg-red-100 text-red-800'>Admin</Badge>
                            : user.requested_supervisor ? (
                              <Badge variant="secondary" className='bg-yellow-100 text-yellow-800'>Supervisor</Badge>
                            ) : <Badge variant="secondary">Intern</Badge>
                            }
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
  )
}

function AllInternsTab(
  { interns }: {
    interns: InternWithBills[];
  }
) {

  const [expandedIntern, setExpandedIntern] = useState<string | null>(null);
  const [editingIntern, setEditingIntern] = useState<boolean>(false);
  return (
    <TabsContent value="all-interns" className="mx-8 space-y-8 mt-6">
          {/* All Interns */}
          <div>
            <h1 className="text-2xl font-bold mb-1 ">All Interns</h1>
            <h2 className="text-sm mb-6 text-muted-foreground">View all intern accounts</h2>
              <div className="space-y-4">
                {interns.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-center text-muted-foreground">
                      No interns found
                    </p>
                  </Card>
                ) : (
                  <Table className='border bg-white shadow-sm'>
                    <TableHeader>
                      <TableRow className='bg-gray-100'>
                        <TableHead className='font-bold'>Intern</TableHead>
                        <TableHead className='font-bold'>Supervisor</TableHead>
                        <TableHead className='font-bold'>Status</TableHead>
                        <TableHead className='font-bold'>Joined</TableHead>
                        <TableHead className='font-bold'>Adopted Bills</TableHead>                        
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interns.map((intern) => (
                        <React.Fragment key={intern.id}>
                          <TableRow key={intern.id} className="cursor-pointer" onClick={() => {
                            if (expandedIntern === intern.id) {
                              setExpandedIntern(null);
                            } else {
                              setExpandedIntern(intern.id);
                            }
                          }}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <p className='text-foreground font-semibold'>{intern.username}</p>
                                  <p className='text-muted-foreground'>{intern.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {intern.supervisor_username 
                                ? intern.supervisor_username 
                                : <span className='text-muted-foreground italic'>Not Assigned</span>}
                              </TableCell>                          
                              <TableCell>
                                {intern.account_status === 'active' ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : intern.account_status === 'pending' ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">Pending Promotion</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">{intern.account_status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {intern.created_at ? intern.created_at.toLocaleDateString() : 'Unknown'}
                              </TableCell>
                              <TableCell>
                                {intern.adopted_bills.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">No adopted bills</span>
                                ) : (
                                  // Expand List of adopted bills
                                  <div className='flex items-center gap-2'>
                                    {intern.adopted_bills.length} bills                                   
                                      <ChevronDown className={`w-4 h-4 transition-transform ${
                                        expandedIntern === intern.id ? 'rotate-180' : ''
                                      }`} ></ChevronDown>
                                  </div>
                                )}

                                {/* TODO: Make able to edit intern details (suspend, delete, remove bills from them) */}                                
                              </TableCell>

                          </TableRow>

                          {expandedIntern === intern.id && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-gray-50 p-0">
                                <div className="p-4">
                                  <h3 className="font-semibold mb-2">Adopted Bills</h3>
                                  {intern.adopted_bills.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No adopted bills</p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gray-100">
                                          <TableHead>Bill Number</TableHead>
                                          <TableHead>Title</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>Intern Adopted</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {intern.adopted_bills.map((bill) => (
                                          <TableRow key={bill.bill_id} className="bg-white">
                                            <TableCell>
                                              <Badge variant="outline">{bill.bill_number || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                              {bill.bill_title || 'No Title'}
                                            </TableCell>
                                            <TableCell className='font-semibold'>                                              
                                                {formatBillStatusName(bill.current_status) || 'Unknown Status'}                                              
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                              {bill.adopted_at ? new Date(bill.adopted_at).toLocaleDateString() : 'Unknown'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}                      
                    </TableBody>
                  </Table>
                )}
               </div>
          </div>


      </TabsContent>    
  )
}