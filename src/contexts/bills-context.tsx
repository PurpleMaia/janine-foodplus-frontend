// 'use client';

// import { getAllBills, getUserAdoptedBills, updateBillStatusServerAction } from '@/services/legislation';
// import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, useMemo } from 'react';
// import type { Bill, TempBill } from '@/types/legislation';
// import { toast } from '../hooks/use-toast';
// import { useAuth } from '@/contexts/auth-context';

// interface BillsContextType {
//   loadingBills: boolean
//   setLoadingBills: Dispatch<SetStateAction<boolean>>;
//   bills: Bill[]
//   setBills: Dispatch<SetStateAction<Bill[]>>;
//   tempBills: TempBill[]
//   setTempBills: Dispatch<SetStateAction<TempBill[]>>;
//   acceptLLMChange: (billId: string) => Promise<void>;
//   rejectLLMChange: (billId: string) => Promise<void>;
//   rejectAllLLMChanges: () => Promise<void>;
//   acceptAllLLMChanges: () => Promise<void>;
//   resetBills: () => Promise<void>;
//   refreshBills: () => Promise<void>;
// }

// const BillsContext = createContext<BillsContextType | undefined>(undefined)

// export function BillsProvider({ children }: { children : ReactNode }) {
//     // const [billStatuses, setBillStatuses] = useState<BillStatus[]>([])   
//     const [bills, setBills] = useState<Bill[]>([]);
//     const [tempBills, setTempBills] = useState<TempBill[]>([])
//     const [, setError] = useState<string | null>(null);
//     const [loadingBills, setLoadingBills] = useState(false);   
//     const { user, loading: userLoading } = useAuth();

//     const acceptLLMChange = async(billId: string) => {
//       const bill = bills.find(b => b.id === billId)
//       if (!bill || !bill.llm_suggested) return;
//       try {
//         // Update server with the new status
//         await updateBillStatusServerAction(billId, bill.current_status);
        
//         // Update local state - remove LLM flags
//         setBills(prevBills => 
//           prevBills.map(b => 
//             b.id === billId 
//               ? { 
//                   ...b, 
//                   llm_suggested: false, 
//                   previous_status: undefined 
//                 }
//               : b
//             )
//           );

//         // Remove the corresponding temp bill
//         setTempBills(prevTempBills => 
//           prevTempBills.filter(tb => tb.id !== billId)
//         );
  
//         toast({
//           title: 'Change Accepted',
//           description: `${bill.bill_number} status updated to ${bill.current_status}`,
//           variant: 'default',
//         });
//       } catch (error) {
//         toast({
//           title: 'Error',
//           description: 'Failed to accept the change. Please try again.',
//           variant: 'destructive',
//         });
//       }
//     };    

//     const rejectLLMChange = async (billId: string) => {
//       const bill = bills.find(b => b.id === billId)
//       if (!bill || !bill.llm_suggested) return;

//       setBills(prevBills => 
//         prevBills.map(b =>
//           b.id === billId
//             ? {
//                 ...b,
//                 current_status: b.previous_status!,
//                 llm_suggested: false,
//                 previous_status: undefined
//             }
//           : b
//         )
//       )      

//       // Remove the corresponding temp bill
//       setTempBills(prevTempBills => 
//         prevTempBills.filter(tb => tb.id !== billId)
//       );

//       toast({
//         title: 'Change Rejected',
//         description: `${bill.bill_number} reverted to ${bill.previous_status}`,
//         variant: 'default',
//       });
//     }

//     const rejectAllLLMChanges = async () => {
//       const suggestedBills = bills.filter(b => b.llm_suggested);
      
//       for (const bill of suggestedBills) {
//         await rejectLLMChange(bill.id);
//       }
  
//       toast({
//         title: 'All Changes Rejected',
//         description: `Rejected ${suggestedBills.length} AI suggestions`,
//         variant: 'default',
//       });
//     };

//     const acceptAllLLMChanges = async () => {
//       const suggestedBills = bills.filter(b => b.llm_suggested)

//       for (const bill of suggestedBills) {
//         await acceptLLMChange(bill.id);
//       }
  
//       toast({
//         title: 'All Changes Accepted',
//         description: `Accepted ${suggestedBills.length} AI suggestions`,
//         variant: 'default',
//       });
//     }

//     const resetBills = async() => {
//       // Clear temp bills
//       setTempBills([]);

//       // Reset all bill states
//       setBills(prevBills => 
//         prevBills.map(bill => ({
//           ...bill,
//           llm_processing: false,
//           llm_suggested: false,
//           current_status: bill.previous_status || bill.current_status,
//           previous_status: undefined
//         }))
//       );
//     }

//     const refreshBills = async() => {
//       console.log('Refreshing bills...')
//       setLoadingBills(true)
//       setError(null);        
//       try {
//         if (user) {
//           const results = await getUserAdoptedBills(user.id);
//           setBills(results);
//           console.log('User adopted bills set in context')
//           console.log(results)
//           return;   
//         }
//         const results = await getAllBills();
//         setBills(results);
//         console.log('successful results set in context')
//         console.log(results)
//       } catch (err) {
//         console.error("Error searching bills:", err);
//         setError("Failed to search bills.");
//       } finally {
//         setLoadingBills(false);    
//       }
//     }

//     useEffect(() => {
//       if (userLoading) return; // wait until auth resolves
    
//       let cancelled = false;
    
//       (async () => {
//         setLoadingBills(true);
//         setError(null);
//         try {
//           if (user) {
//             // LOGGED-IN PATH
//             const results = await getUserAdoptedBills(user.id);
//             if (!cancelled) {
//               setBills(results);
//               console.log('User adopted bills set in context', results.length);
//             }
//           } else {
//             // PUBLIC PATH
//             const results = await getAllBills();
//             if (!cancelled) {
//               setBills(results);
//               console.log('There are', results.length, 'bills');
//               console.log('successful results set in context');
//             }
//           }
//         } catch (err) {
//           if (!cancelled) {
//             console.error('Error searching bills:', err);
//             setError('Failed to search bills.');
//           }
//         } finally {
//           if (!cancelled) setLoadingBills(false);
//         }
//       })();
    
//       return () => { cancelled = true; };
//     }, [user, userLoading]);

//     const value = useMemo(() => ({
//       loadingBills, setLoadingBills, bills, setBills, acceptLLMChange, rejectLLMChange, tempBills, setTempBills, rejectAllLLMChanges, acceptAllLLMChanges, resetBills, refreshBills
//     }), [bills, loadingBills, tempBills, acceptLLMChange, acceptAllLLMChanges, rejectLLMChange, rejectAllLLMChanges, resetBills, refreshBills])
//     return (
//         <BillsContext.Provider value={value}>
//             {children}
//         </BillsContext.Provider>
//     )
// }

// export function useBills() {
//     const context = useContext(BillsContext)
//     if (context === undefined) {
//         throw new Error('useCardUpdate must be used within a UpdateCardProvider');
//       }
//       return context;
// }


'use client';

import {
  getAllBills,
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
  const { user, loading: userLoading } = useAuth();

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
    
    const target_idx = 0; // optional: compute from KANBAN_COLUMNS if you want to scroll later
    const proposal: TempBill = {
      id: bill.id,
      current_status: bill.current_status,
      suggested_status,
      target_idx,
      source: 'human',
      approval_status: 'pending',
      proposed_by: {
        user_id: meta.userId,
        role: meta.role,
        at: new Date().toISOString(),
        note: meta.note,
      },
    };

    try {
      // Save to database
      const response = await fetch('/api/proposals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: bill.id,
          currentStatus: bill.current_status,
          suggestedStatus: suggested_status,
          note: meta.note,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save proposal');
      }

      // Update local state
      setTempBills((prev) => {
        const filtered = prev.filter((tb) => tb.id !== bill.id);
        return [...filtered, proposal];
      });

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
    setLoadingBills(true);
    setError(null);
    try {
      if (user) {
        const results = await getUserAdoptedBills(user.id);
        setBills(results);
        console.log('User adopted bills set in context');
        console.log(results);
        return;
      }
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

  // initial load
  useEffect(() => {
    if (userLoading) return; // wait until auth resolves

    let cancelled = false;

    (async () => {
      setLoadingBills(true);
      setError(null);
      try {
        if (user) {
          // LOGGED-IN PATH
          const results = await getUserAdoptedBills(user.id);
          if (!cancelled) {
            setBills(results);
            console.log('User adopted bills set in context', results.length);

            // Load pending proposals for bills owned by the user
            const proposalsResponse = await fetch('/api/proposals/load');
            if (proposalsResponse.ok) {
              const data = await proposalsResponse.json();
              if (data.success && data.proposals) {
                setTempBills(data.proposals);
                console.log('Loaded', data.proposals.length, 'pending proposals');
              }
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
  }, [user, userLoading]);

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
