
'use client';

import {
  getAllBills,
  getAllFoodRelatedBills,
  getUserAdoptedBills,
  updateBillStatusServerAction,
} from '@/services/legislation';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type { Bill, BillStatus, TempBill } from '@/types/legislation';
import { toast } from '../hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface BillsContextType {
  loadingBills: boolean;
  setLoadingBills: Dispatch<SetStateAction<boolean>>;
  bills: Bill[];
  setBills: Dispatch<SetStateAction<Bill[]>>;
  tempBills: TempBill[];
  setTempBills: Dispatch<SetStateAction<TempBill[]>>;

  // LLM suggestion controls (existing)
  acceptLLMChange: (billId: string) => Promise<void>;
  rejectLLMChange: (billId: string) => Promise<void>;
  rejectAllLLMChanges: () => Promise<void>;
  acceptAllLLMChanges: () => Promise<void>;

  // NEW: human proposal controls
  proposeStatusChange: (
    bill: Bill,
    suggested_status: BillStatus,
    meta: { userId: string; role: 'intern' | 'supervisor' | 'admin'; note?: string }
  ) => Promise<void>;
  acceptTempChange: (billId: string) => Promise<void>;
  rejectTempChange: (billId: string) => Promise<void>;
  acceptAllTempChanges: () => Promise<void>;
  rejectAllTempChanges: () => Promise<void>;
  updateBillNickname: (billId: string, nickname: string) => Promise<void>;

  // View mode toggle
  viewMode: 'my-bills' | 'all-bills';
  setViewMode: (mode: 'my-bills' | 'all-bills') => void;
  toggleViewMode: () => void;

  resetBills: () => Promise<void>;
  refreshBills: () => Promise<void>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined);

const canCommitStatus = (role?: string) =>
  role === 'supervisor' || role === 'admin';

export function BillsProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [tempBills, setTempBills] = useState<TempBill[]>([]);
  const [, setError] = useState<string | null>(null);
  const [loadingBills, setLoadingBills] = useState(false);
  const [viewMode, setViewMode] = useState<'my-bills' | 'all-bills'>('my-bills');
  const { user, loading: userLoading } = useAuth();

  const reloadProposalsFromServer = useCallback(async () => {
    try {
      console.log('🔄 [SYNC] Fetching proposals from API...');
      const response = await fetch('/api/proposals/load');
      if (!response.ok) {
        console.error('❌ [SYNC] API response not OK:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.proposals)) {
        console.log(`✅ [SYNC] Synced ${data.proposals.length} proposals from API`);
        setTempBills(data.proposals);
        return data.proposals as TempBill[];
      }

      console.warn('⚠️ [SYNC] Unexpected proposals payload:', data);
      setTempBills([]);
      return [];
    } catch (error) {
      console.error('❌ [SYNC] Error reloading proposals:', error);
      return null;
    }
  }, []);

  // ========= LLM SUGGESTIONS (existing) =========

  const acceptLLMChange = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill || !bill.llm_suggested) return;

    try {
      // Commit current_status that LLM suggested
      await updateBillStatusServerAction(billId, bill.current_status);

      // Clear LLM flags locally
      setBills((prevBills) =>
        prevBills.map((b) =>
          b.id === billId
            ? { ...b, llm_suggested: false, previous_status: undefined }
            : b
        )
      );

      // Remove corresponding temp bill (if any)
      setTempBills((prev) => prev.filter((tb) => tb.id !== billId));

      toast({
        title: 'Change Accepted',
        description: `${bill.bill_number} status updated to ${bill.current_status}`,
        variant: 'default',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to accept the change. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const rejectLLMChange = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill || !bill.llm_suggested) return;

    // Revert locally
    setBills((prevBills) =>
      prevBills.map((b) =>
        b.id === billId
          ? {
              ...b,
              current_status: b.previous_status!,
              llm_suggested: false,
              previous_status: undefined,
            }
          : b
      )
    );

    // Remove temp record
    setTempBills((prev) => prev.filter((tb) => tb.id !== billId));

    toast({
      title: 'Change Rejected',
      description: `${bill.bill_number} reverted to ${bill?.previous_status}`,
      variant: 'default',
    });
  };

  const rejectAllLLMChanges = async () => {
    const suggestedBills = bills.filter((b) => b.llm_suggested);
    for (const bill of suggestedBills) {
      await rejectLLMChange(bill.id);
    }
    toast({
      title: 'All Changes Rejected',
      description: `Rejected ${suggestedBills.length} AI suggestions`,
      variant: 'default',
    });
  };

  const acceptAllLLMChanges = async () => {
    const suggestedBills = bills.filter((b) => b.llm_suggested);
    for (const bill of suggestedBills) {
      await acceptLLMChange(bill.id);
    }
    toast({
      title: 'All Changes Accepted',
      description: `Accepted ${suggestedBills.length} AI suggestions`,
      variant: 'default',
    });
  };

  // ========= HUMAN PROPOSALS (new) =========

  // Create/replace a pending proposal (for interns or supervisors who want review)
  const proposeStatusChange: BillsContextType['proposeStatusChange'] = async (
    bill,
    suggested_status,
    meta
  ) => {
    console.log('🟣 proposeStatusChange called:', bill.id, '→', suggested_status);
    console.log('🟣 Bill data:', {
      id: bill.id,
      current_status: bill.current_status,
      suggested_status,
    });

    // Validate required fields before sending
    if (!bill.id) {
      throw new Error('Bill ID is missing');
    }
    
    // Handle missing or empty current_status with fallback
    const currentStatus = bill.current_status?.trim() || 'unassigned';
    if (!currentStatus || currentStatus === '') {
      console.warn(`⚠️ Bill ${bill.id} has missing current_status, using 'unassigned' as fallback`);
    }
    
    if (!suggested_status || suggested_status.trim() === '') {
      throw new Error(`Suggested status is missing or empty. Bill ID: ${bill.id}`);
    }
    
    const target_idx = 0; // optional: compute from KANBAN_COLUMNS if you want to scroll later
    const proposal: TempBill = {
      id: bill.id,
      current_status: currentStatus as BillStatus,
      suggested_status,
      target_idx,
      source: 'human',
      approval_status: 'pending',
      proposed_by: {
        user_id: meta.userId,
        role: meta.role,
        at: new Date().toISOString(),
        note: meta.note,
        username: (user?.username as string | undefined) ?? undefined,
        email: (user?.email as string | undefined) ?? undefined,
      },
    };

    try {
      // Prepare request body
      const requestBody = {
        billId: bill.id,
        currentStatus: currentStatus,
        suggestedStatus: suggested_status,
        note: meta.note || undefined,
      };

      console.log('🟣 Sending proposal request:', requestBody);

      // Save to database
      const response = await fetch('/api/proposals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.details || errorData.error || 'Failed to save proposal';
        console.error('❌ Save proposal error:', errorMsg, errorData);
        throw new Error(errorMsg);
      }

      const proposals = await reloadProposalsFromServer();
      if (proposals === null) {
        console.error('❌ [SYNC] Falling back to local proposal update');
        setTempBills((prev) => {
          const filtered = prev.filter((tb) => tb.id !== bill.id);
          return [...filtered, proposal];
        });
      }

      toast({
        title: 'Change Proposed',
        description: `Pending: ${bill.bill_number} → ${suggested_status}`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error proposing change:', error);
      toast({
        title: 'Error',
        description: 'Failed to save proposal',
        variant: 'destructive',
      });
    }
  };

  // Supervisor/Admin approves a single proposal
  const acceptTempChange: BillsContextType['acceptTempChange'] = async (
    billId
  ) => {
    const tb = tempBills.find((t) => t.id === billId);
    if (!tb) return;

    if (!canCommitStatus(user?.role)) {
      toast({
        title: 'Forbidden',
        description: 'You do not have permission to approve changes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call API to approve proposal (which updates bill status and marks proposal as approved)
      const proposalId = (tb as any).proposalId; // Get the actual proposal ID
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

      // Update bills list to reflect the new status
      setBills((prev) =>
        prev.map((b) =>
          b.id === billId
            ? {
                ...b,
                previous_status: b.current_status,
                current_status: tb.suggested_status as BillStatus,
                llm_suggested: false,
                llm_processing: false,
              }
            : b
        )
      );

      // Remove proposal from local state
      setTempBills((prev) => prev.filter((t) => t.id !== billId));

      const proposals = await reloadProposalsFromServer();
      if (proposals === null) {
        console.warn('⚠️ [SYNC] Unable to reload proposals after approval; keeping local state');
      }

      toast({
        title: 'Proposal Approved',
        description: `Bill updated to ${tb.suggested_status}`,
        variant: 'default',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to approve proposal.',
        variant: 'destructive',
      });
    }
  };

  // Supervisor/Admin rejects a single proposal
  const rejectTempChange: BillsContextType['rejectTempChange'] = async (
    billId
  ) => {
    const tb = tempBills.find((t) => t.id === billId);
    if (!tb) return;

    if (!canCommitStatus(user?.role)) {
      toast({
        title: 'Forbidden',
        description: 'You do not have permission to reject changes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call API to reject proposal
      const proposalId = (tb as any).proposalId;
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

      // Remove from local state
      setTempBills((prev) => prev.filter((t) => t.id !== billId));

      const proposals = await reloadProposalsFromServer();
      if (proposals === null) {
        console.warn('⚠️ [SYNC] Unable to reload proposals after rejection; keeping local state');
      }

      toast({
        title: 'Proposal Rejected',
        description: `Pending change discarded.`,
        variant: 'default',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to reject proposal.',
        variant: 'destructive',
      });
    }
  };

  const updateBillNickname: BillsContextType['updateBillNickname'] = async (
    billId,
    nickname
  ) => {
    const trimmed = nickname.trim();
    const previous =
      bills.find((b) => b.id === billId)?.user_nickname ?? null;

    setBills((prev) =>
      prev.map((b) =>
        b.id === billId ? { ...b, user_nickname: trimmed || null } : b
      )
    );

    try {
      const response = await fetch('/api/bills/nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billId, nickname: trimmed }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save nickname');
      }

      const savedNickname = data.nickname ?? (trimmed || null);
      setBills((prev) =>
        prev.map((b) =>
          b.id === billId ? { ...b, user_nickname: savedNickname } : b
        )
      );
    } catch (error) {
      console.error('Failed to update bill nickname:', error);
      setBills((prev) =>
        prev.map((b) =>
          b.id === billId ? { ...b, user_nickname: previous } : b
        )
      );
      throw error instanceof Error ? error : new Error('Failed to save nickname');
    }
  };

  const acceptAllTempChanges: BillsContextType['acceptAllTempChanges'] =
    async () => {
      if (!canCommitStatus(user?.role)) {
        toast({
          title: 'Forbidden',
          description: 'You do not have permission to approve changes.',
          variant: 'destructive',
        });
        return;
      }
      const humanProposals = tempBills.filter((t) => t.source === 'human');
      const ops = humanProposals.map((t) => acceptTempChange(t.id));
      await Promise.allSettled(ops);
      await reloadProposalsFromServer();
      // acceptTempChange already toasts per item; you can also add a summary here if you want.
    };

  const rejectAllTempChanges: BillsContextType['rejectAllTempChanges'] =
    async () => {
      const humanProposals = tempBills.filter((t) => t.source === 'human');
      if (humanProposals.length === 0) return;
      setTempBills((prev) => prev.filter((t) => t.source !== 'human'));
      toast({
        title: 'All Proposals Rejected',
        description: `Discarded ${humanProposals.length} pending changes.`,
        variant: 'default',
      });
    };

  // ========= RESET / REFRESH (existing) =========

  const resetBills = async () => {
    // Clear temp bills (both LLM and human proposals)
    setTempBills([]);

    // Reset all bill states
    setBills((prevBills) =>
      prevBills.map((bill) => ({
        ...bill,
        llm_processing: false,
        llm_suggested: false,
        current_status: bill.previous_status || bill.current_status,
        previous_status: undefined,
      }))
    );
  };

  const refreshBills = async () => {
    console.log('Refreshing bills...');
    // Clear bills first to show skeleton immediately
    setBills([]);
    setLoadingBills(true);
    setError(null);
    
    // Small delay to ensure loading state is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      if (user) {
        // LOGGED-IN PATH: respect view mode
        let results;
        if (viewMode === 'my-bills') {
          results = await getUserAdoptedBills(user.id);
          console.log('User adopted bills set in context');
        } else {
          // All bills view
          results = await getAllBills();
          console.log('All food-related bills set in context');
        }
        setBills(results);
        console.log(results);
        return;
      }
      // Public view: only all bills
      const results = await getAllBills();
      setBills(results);
      console.log('successful results set in context');
      console.log(results);
    } catch (err) {
      console.error('Error searching bills:', err);
      setError('Failed to search bills.');
    } finally {
      setLoadingBills(false);
    }
  };

  const toggleViewMode = useCallback(() => {
    if (!user) return;
    
    const newMode = viewMode === 'my-bills' ? 'all-bills' : 'my-bills';
    setViewMode(newMode);
    
    // Refresh bills when toggling (moved outside state setter to avoid render issues)
    (async () => {
      setLoadingBills(true);
      try {
        if (newMode === 'my-bills') {
          const results = await getUserAdoptedBills(user.id);
          setBills(results);
        } else {
          const results = await getAllFoodRelatedBills();
          setBills(results);
        }
      } catch (err) {
        console.error('Error refreshing bills on toggle:', err);
        setError('Failed to refresh bills.');
      } finally {
        setLoadingBills(false);
      }
    })();
  }, [user, viewMode]);

  // initial load
  useEffect(() => {
    if (userLoading) return; // wait until auth resolves

    let cancelled = false;

    (async () => {
      setLoadingBills(true);
      setError(null);
      try {
        if (user) {
          // LOGGED-IN PATH: respect view mode
          let results;
          if (viewMode === 'my-bills') {
            results = await getUserAdoptedBills(user.id);
            console.log('User adopted bills set in context', results.length);
          } else {
            results = await getAllBills();
            console.log('All food-related bills set in context', results.length);
          }
          if (!cancelled) {
            setBills(results);

            // Load pending proposals for bills owned by the user
            console.log('🔄 [INITIAL LOAD] Fetching proposals from API...');
            const proposalsResponse = await fetch('/api/proposals/load');
            if (proposalsResponse.ok) {
              const data = await proposalsResponse.json();
              if (data.success && data.proposals) {
                console.log('🔄 [INITIAL LOAD] Received', data.proposals.length, 'proposals from API');
                data.proposals.forEach((p: any, idx: number) => {
                  console.log(`  [${idx + 1}] Bill ID: ${p.id}, Status: ${p.current_status} → ${p.suggested_status}`);
                });
                setTempBills(data.proposals);
                console.log('✅ [INITIAL LOAD] Updated tempBills state with', data.proposals.length, 'proposals');
              } else {
                console.warn('⚠️ [INITIAL LOAD] API returned success but no proposals:', data);
              }
            } else {
              console.error('❌ [INITIAL LOAD] API response not OK:', proposalsResponse.status);
            }
          }
        } else {
          // PUBLIC PATH
          const results = await getAllBills();
          if (!cancelled) {
            setBills(results);
            console.log('There are', results.length, 'bills');
            console.log('successful results set in context');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error searching bills:', err);
          setError('Failed to search bills.');
        }
      } finally {
        if (!cancelled) setLoadingBills(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, viewMode]);

  const value = useMemo(
    () => ({
      loadingBills,
      setLoadingBills,
      bills,
      setBills,
      tempBills,
      setTempBills,

      // LLM
      acceptLLMChange,
      rejectLLMChange,
      rejectAllLLMChanges,
      acceptAllLLMChanges,

      // HUMAN proposals
      proposeStatusChange,
      acceptTempChange,
      rejectTempChange,
      acceptAllTempChanges,
      rejectAllTempChanges,
      updateBillNickname,

      // View mode
      viewMode,
      setViewMode,
      toggleViewMode,

      resetBills,
      refreshBills,
    }),
    [
      bills,
      loadingBills,
      tempBills,
      acceptLLMChange,
      acceptAllLLMChanges,
      rejectLLMChange,
      rejectAllLLMChanges,
      proposeStatusChange,
      acceptTempChange,
      rejectTempChange,
      acceptAllTempChanges,
      rejectAllTempChanges,
      updateBillNickname,
      viewMode,
      setViewMode,
      toggleViewMode,
      resetBills,
      refreshBills,
    ]
  );

  return (
    <BillsContext.Provider value={value}>{children}</BillsContext.Provider>
  );
}

export function useBills() {
  const context = useContext(BillsContext);
  if (context === undefined) {
    throw new Error('useCardUpdate must be used within a UpdateCardProvider');
  }
  return context;
}
