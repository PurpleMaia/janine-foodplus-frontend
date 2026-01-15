'use client';

import {
  getAllBills,
  getAllFoodRelatedBills,
  getUserAdoptedBills,
  updateBillStatusServerAction,
} from '@/services/data/legislation';
import { getBatchBillTags } from '@/services/data/tags';
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
  // State
  loadingBills: boolean;
  setLoadingBills: Dispatch<SetStateAction<boolean>>;
  bills: Bill[];
  setBills: Dispatch<SetStateAction<Bill[]>>;
  tempBills: TempBill[];
  setTempBills: Dispatch<SetStateAction<TempBill[]>>;

  // LLM Suggestion Controls
  acceptLLMChange: (billId: string) => Promise<void>;
  rejectLLMChange: (billId: string) => Promise<void>;
  rejectAllLLMChanges: () => Promise<void>;
  acceptAllLLMChanges: () => Promise<void>;

  // Human Proposal Controls
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

  // View Mode
  viewMode: 'my-bills' | 'all-bills';
  setViewMode: (mode: 'my-bills' | 'all-bills') => void;
  toggleViewMode: () => void;

  // Bill CRUD Operations
  addBill: (bill: Bill) => void;
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  removeBill: (billId: string) => void;

  // Data Operations
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

  /**
   * Reloads proposals from the server and updates local state
   * @returns Array of proposals or null if failed
   */
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

  /**
   * Fetches bills and their tags based on view mode
   * @param viewModeOverride Optional view mode to use instead of current state
   */
  const fetchBillsWithTags = useCallback(async (viewModeOverride?: 'my-bills' | 'all-bills') => {
    const mode = viewModeOverride ?? viewMode;

    let results: Bill[] = [];
    if (user) {
      if (mode === 'my-bills') {
        results = await getUserAdoptedBills(user.id);
        console.log('User adopted bills fetched:', results.length);
      } else {
        results = await getAllFoodRelatedBills();
        console.log('All food-related bills fetched:', results.length);
      }
    } else {
      results = await getAllBills();
      console.log('Public bills fetched:', results.length);
    }

    // Fetch tags using batch API
    const billIds = results.map(bill => bill.id);
    const tagsByBillId = await getBatchBillTags(billIds);

    return results.map(bill => ({
      ...bill,
      tags: tagsByBillId[bill.id] || []
    }));
  }, [user, viewMode]);

  // ---------------------------------------------------------------------------
  // SECTION 1: LLM SUGGESTION OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Accepts an LLM suggestion and commits the status change to the database
   */
  const acceptLLMChange = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill || !bill.llm_suggested) return;

    try {
      await updateBillStatusServerAction(billId, bill.current_status);

      setBills((prevBills) =>
        prevBills.map((b) =>
          b.id === billId
            ? { ...b, llm_suggested: false, previous_status: undefined }
            : b
        )
      );

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

  /**
   * Rejects an LLM suggestion and reverts to the previous status
   */
  const rejectLLMChange = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill || !bill.llm_suggested) return;

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

    setTempBills((prev) => prev.filter((tb) => tb.id !== billId));

    toast({
      title: 'Change Rejected',
      description: `${bill.bill_number} reverted to ${bill?.previous_status}`,
      variant: 'default',
    });
  };

  /**
   * Rejects all pending LLM suggestions
   */
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

  /**
   * Accepts all pending LLM suggestions
   */
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

  // ---------------------------------------------------------------------------
  // SECTION 2: HUMAN PROPOSAL OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Creates or updates a pending proposal for a bill status change
   * Used by interns or supervisors who want review before committing
   */
  const proposeStatusChange: BillsContextType['proposeStatusChange'] = async (
    bill,
    suggested_status,
    meta
  ) => {
    console.log('🟣 proposeStatusChange called:', bill.id, '→', suggested_status);

    // Validate required fields
    if (!bill.id) {
      throw new Error('Bill ID is missing');
    }

    const currentStatus = bill.current_status?.trim() || 'unassigned';
    if (!currentStatus || currentStatus === '') {
      console.warn(`⚠️ Bill ${bill.id} has missing current_status, using 'unassigned' as fallback`);
    }

    if (!suggested_status || suggested_status.trim() === '') {
      throw new Error(`Suggested status is missing or empty. Bill ID: ${bill.id}`);
    }

    const proposal: TempBill = {
      id: bill.id,
      bill_title: bill.bill_title || null,
      current_status: currentStatus as BillStatus,
      suggested_status,
      target_idx: 0,
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
      const requestBody = {
        billId: bill.id,
        currentStatus: currentStatus,
        suggestedStatus: suggested_status,
        note: meta.note || undefined,
      };

      console.log('🟣 Sending proposal request:', requestBody);

      const response = await fetch('/api/proposals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  /**
   * Supervisor/Admin approves a single proposal
   * Commits the change to the database and updates local state
   */
  const acceptTempChange: BillsContextType['acceptTempChange'] = async (billId) => {
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

    // Check if this is an LLM suggestion
    const proposalId = (tb as any).proposalId;
    const bill = bills.find((b) => b.id === billId);
    const isLLMSuggestion = !proposalId || tb.source === 'llm' || bill?.llm_suggested;

    if (isLLMSuggestion) {
      await acceptLLMChange(billId);
      return;
    }

    try {
      const response = await fetch('/api/proposals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve proposal');
      }

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

      setTempBills((prev) => prev.filter((t) => t.id !== billId));

      const proposals = await reloadProposalsFromServer();
      if (proposals === null) {
        console.warn('⚠️ [SYNC] Unable to reload proposals after approval');
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

  /**
   * Supervisor/Admin rejects a single proposal
   * Removes the proposal from pending state
   */
  const rejectTempChange: BillsContextType['rejectTempChange'] = async (billId) => {
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

    // Check if this is an LLM suggestion
    const proposalId = (tb as any).proposalId;
    const bill = bills.find((b) => b.id === billId);
    const isLLMSuggestion = !proposalId || tb.source === 'llm' || bill?.llm_suggested;

    if (isLLMSuggestion) {
      await rejectLLMChange(billId);
      return;
    }

    try {
      const response = await fetch('/api/proposals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject proposal');
      }

      setTempBills((prev) => prev.filter((t) => t.id !== billId));

      const proposals = await reloadProposalsFromServer();
      if (proposals === null) {
        console.warn('⚠️ [SYNC] Unable to reload proposals after rejection');
      }

      toast({
        title: 'Proposal Rejected',
        description: 'Pending change discarded.',
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

  /**
   * Approves all pending human proposals
   */
  const acceptAllTempChanges: BillsContextType['acceptAllTempChanges'] = async () => {
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
  };

  /**
   * Rejects all pending human proposals
   */
  const rejectAllTempChanges: BillsContextType['rejectAllTempChanges'] = async () => {
    const humanProposals = tempBills.filter((t) => t.source === 'human');
    if (humanProposals.length === 0) return;
    setTempBills((prev) => prev.filter((t) => t.source !== 'human'));
    toast({
      title: 'All Proposals Rejected',
      description: `Discarded ${humanProposals.length} pending changes.`,
      variant: 'default',
    });
  };

  /**
   * Updates the user's custom nickname for a bill
   */
  const updateBillNickname: BillsContextType['updateBillNickname'] = async (
    billId,
    nickname
  ) => {
    const trimmed = nickname.trim();
    const previous = bills.find((b) => b.id === billId)?.user_nickname ?? null;

    setBills((prev) =>
      prev.map((b) =>
        b.id === billId ? { ...b, user_nickname: trimmed || null } : b
      )
    );

    try {
      const response = await fetch('/api/bills/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // ---------------------------------------------------------------------------
  // SECTION 3: BILL CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Adds a new bill to the bills array
   * If bill already exists, updates it instead
   */
  const addBill = useCallback((bill: Bill) => {
    setBills((prevBills) => {
      const exists = prevBills.some(b => b.id === bill.id);
      if (exists) {
        console.warn(`Bill ${bill.id} already exists, updating instead`);
        return prevBills.map(b => b.id === bill.id ? bill : b);
      }
      return [...prevBills, bill];
    });
  }, []);

  /**
   * Updates specific fields of a bill without refreshing the entire list
   * Preserves Kanban board state (scroll position, drag state, etc.)
   */
  const updateBill = useCallback((billId: string, updates: Partial<Bill>) => {
    setBills((prevBills) =>
      prevBills.map((bill) =>
        bill.id === billId ? { ...bill, ...updates } : bill
      )
    );
  }, []);

  /**
   * Removes a bill from the bills array
   */
  const removeBill = useCallback((billId: string) => {
    setBills((prevBills) => prevBills.filter(bill => bill.id !== billId));
  }, []);

  // ---------------------------------------------------------------------------
  // SECTION 4: DATA OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Resets all bill states and clears proposals
   * Reverts any pending LLM suggestions
   */
  const resetBills = async () => {
    setTempBills([]);
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

  /**
   * Refreshes the bills list from the server
   * Uses batch API for efficient tag fetching
   * Does NOT clear bills during refresh to preserve Kanban board state
   */
  const refreshBills = async () => {
    console.log('Refreshing bills...');
    setLoadingBills(true);
    setError(null);

    try {
      const billsWithTags = await fetchBillsWithTags();
      setBills(billsWithTags);
      console.log('Bills refreshed successfully:', billsWithTags.length);
    } catch (err) {
      console.error('Error refreshing bills:', err);
      setError('Failed to refresh bills.');
    } finally {
      setLoadingBills(false);
    }
  };

  /**
   * Toggles between 'my-bills' and 'all-bills' view modes
   * Automatically fetches the appropriate bills for the new mode
   */
  const toggleViewMode = useCallback(() => {
    if (!user) return;

    const newMode = viewMode === 'my-bills' ? 'all-bills' : 'my-bills';
    setViewMode(newMode);

    (async () => {
      setLoadingBills(true);
      try {
        const billsWithTags = await fetchBillsWithTags(newMode);
        setBills(billsWithTags);
      } catch (err) {
        console.error('Error refreshing bills on toggle:', err);
        setError('Failed to refresh bills.');
      } finally {
        setLoadingBills(false);
      }
    })();
  }, [user, viewMode, fetchBillsWithTags]);

  // ---------------------------------------------------------------------------
  // SECTION 5: INITIAL DATA LOAD
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (userLoading) return;

    let cancelled = false;

    (async () => {
      setLoadingBills(true);
      setError(null);

      try {
        const billsWithTags = await fetchBillsWithTags();

        if (!cancelled) {
          setBills(billsWithTags);

          // Load proposals only for logged-in users
          if (user) {
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
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading initial bills:', err);
          setError('Failed to load bills.');
        }
      } finally {
        if (!cancelled) setLoadingBills(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, viewMode, fetchBillsWithTags]);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      // State
      loadingBills,
      setLoadingBills,
      bills,
      setBills,
      tempBills,
      setTempBills,

      // LLM Operations
      acceptLLMChange,
      rejectLLMChange,
      rejectAllLLMChanges,
      acceptAllLLMChanges,

      // Human Proposal Operations
      proposeStatusChange,
      acceptTempChange,
      rejectTempChange,
      acceptAllTempChanges,
      rejectAllTempChanges,
      updateBillNickname,

      // View Mode
      viewMode,
      setViewMode,
      toggleViewMode,

      // Bill CRUD
      addBill,
      updateBill,
      removeBill,

      // Data Operations
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
      addBill,
      updateBill,
      removeBill,
      resetBills,
      refreshBills,
    ]
  );

  return (
    <BillsContext.Provider value={value}>{children}</BillsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the Bills context
 * Must be used within a BillsProvider
 */
export function useBills() {
  const context = useContext(BillsContext);
  if (context === undefined) {
    throw new Error('useBills must be used within a BillsProvider');
  }
  return context;
}
