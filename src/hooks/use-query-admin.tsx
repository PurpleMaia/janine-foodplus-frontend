'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getPendingRequests,
  getPendingProposals,
  getAllInterns,
  getAllSupervisors,
  getAllInternBills,
  approveProposal,
  rejectProposal,
  approveUser,
  denyUser,
  approveSupervisor,
  rejectSupervisor,
} from '@/app/actions/admin';

// Query keys for cache management
const queryKeys = {
  pendingRequests: ['admin', 'pending-requests'] as const,
  pendingProposals: ['admin', 'pending-proposals'] as const,
  supervisorRequests: ['admin', 'supervisor-requests'] as const,
  allInterns: ['admin', 'all-interns'] as const,
  allSupervisors: ['admin', 'all-supervisors'] as const,
  allInternBills: ['admin', 'all-intern-bills'] as const,
};

export function useAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES - Data Fetching with React Query
  // ============================================

  const pendingRequestsQuery = useQuery({
    queryKey: queryKeys.pendingRequests,
    queryFn: async () => {
      const result = await getPendingRequests();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });

  const pendingProposalsQuery = useQuery({
    queryKey: queryKeys.pendingProposals,
    queryFn: async () => {
      const result = await getPendingProposals();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    staleTime: 30_000,
  });

  const allInternsQuery = useQuery({
    queryKey: queryKeys.allInterns,
    queryFn: async () => {
      const result = await getAllInterns();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    staleTime: 60_000, // Less frequently changing data
  });

  const allSupervisorsQuery = useQuery({
    queryKey: queryKeys.allSupervisors,
    queryFn: async () => {
      const result = await getAllSupervisors();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    staleTime: 60_000,
  });

  const allInternBillsQuery = useQuery({
    queryKey: queryKeys.allInternBills,
    queryFn: async () => {
      const result = await getAllInternBills();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    staleTime: 30_000,
  });

  // ============================================
  // MUTATIONS - Actions with Optimistic Updates
  // ============================================

  const approveProposalMutation = useMutation({
    mutationFn: async ({ proposalId, billId }: { proposalId: string; billId: string }) => {
      const result = await approveProposal(proposalId, billId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Proposal approved' });
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingProposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInternBills });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve proposal',
        variant: 'destructive',
      });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const result = await rejectProposal(proposalId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Proposal rejected' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingProposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInternBills });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject proposal',
        variant: 'destructive',
      });
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveUser(userId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    // Optimistic update example
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pendingRequests });
      const previousData = queryClient.getQueryData(queryKeys.pendingRequests);
      
      // Optimistically remove the user from pending list
      queryClient.setQueryData(queryKeys.pendingRequests, (old: any[]) => 
        old?.filter(user => user.id !== userId) ?? []
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'User has been approved' });
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.pendingRequests, context.previousData);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRequests });
    },
  });

  const denyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await denyUser(userId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pendingRequests });
      const previousData = queryClient.getQueryData(queryKeys.pendingRequests);
      
      queryClient.setQueryData(queryKeys.pendingRequests, (old: any[]) => 
        old?.filter(user => user.id !== userId) ?? []
      );
      
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'User has been denied an account' });
    },
    onError: (error, _userId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.pendingRequests, context.previousData);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to deny user',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRequests });
    },
  });

  const approveSupervisorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveSupervisor(userId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Supervisor access granted' });
      queryClient.invalidateQueries({ queryKey: queryKeys.supervisorRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSupervisors });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve supervisor request',
        variant: 'destructive',
      });
    },
  });

  const rejectSupervisorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await rejectSupervisor(userId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Supervisor request rejected' });
      queryClient.invalidateQueries({ queryKey: queryKeys.supervisorRequests });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject supervisor request',
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // RETURN VALUES - Clean API for Component
  // ============================================

  return {
    // Data
    pendingUsers: pendingRequestsQuery.data ?? [],
    pendingProposals: pendingProposalsQuery.data ?? [],
    allInterns: allInternsQuery.data ?? [],
    allSupervisors: allSupervisorsQuery.data ?? [],
    allInternBills: allInternBillsQuery.data ?? [],

    // Loading states
    isLoading: pendingRequestsQuery.isLoading,
    isLoadingProposals: pendingProposalsQuery.isLoading,
    isLoadingInterns: allInternsQuery.isLoading,
    isLoadingRelationships: allSupervisorsQuery.isLoading,
    isLoadingBills: allInternBillsQuery.isLoading,

    // Error states
    errors: {
      pendingRequests: pendingRequestsQuery.error,
      pendingProposals: pendingProposalsQuery.error,
      allInterns: allInternsQuery.error,
      allSupervisors: allSupervisorsQuery.error,
      allInternBills: allInternBillsQuery.error,
    },

    // Actions (simplified API - no need to pass refetch functions)
    handleApproveProposal: (proposalId: string, billId: string) => 
      approveProposalMutation.mutate({ proposalId, billId }),
    handleRejectProposal: (proposalId: string) => 
      rejectProposalMutation.mutate(proposalId),
    handleApproveUser: (userId: string) => 
      approveUserMutation.mutate(userId),
    handleDenyUser: (userId: string) => 
      denyUserMutation.mutate(userId),
    handleApproveSupervisor: (userId: string) => 
      approveSupervisorMutation.mutate(userId),
    handleRejectSupervisor: (userId: string) => 
      rejectSupervisorMutation.mutate(userId),

    // Mutation loading states (useful for disabling buttons)
    isApproving: approveProposalMutation.isPending || approveUserMutation.isPending || approveSupervisorMutation.isPending,
    isRejecting: rejectProposalMutation.isPending || denyUserMutation.isPending || rejectSupervisorMutation.isPending,

    // Manual refetch functions if needed
    refetch: {
      pendingRequests: () => queryClient.invalidateQueries({ queryKey: queryKeys.pendingRequests }),
      pendingProposals: () => queryClient.invalidateQueries({ queryKey: queryKeys.pendingProposals }),
      allInterns: () => queryClient.invalidateQueries({ queryKey: queryKeys.allInterns }),
      allSupervisors: () => queryClient.invalidateQueries({ queryKey: queryKeys.allSupervisors }),
      allInternBills: () => queryClient.invalidateQueries({ queryKey: queryKeys.allInternBills }),
      all: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    },
  };
}