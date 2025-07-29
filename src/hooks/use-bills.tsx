'use client';

import { getAllBills, updateBillStatusServerAction } from '@/services/legislation';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import type { Bill, TempBill } from '@/types/legislation';
import { toast } from './use-toast';

interface BillsContextType {
  loadingBills: boolean
  setLoadingBills: Dispatch<SetStateAction<boolean>>;
  bills: Bill[]
  setBills: Dispatch<SetStateAction<Bill[]>>;
  tempBills: TempBill[]
  setTempBills: Dispatch<SetStateAction<TempBill[]>>;
  acceptLLMChange: (billId: string) => Promise<void>;
  rejectLLMChange: (billId: string) => Promise<void>;
  rejectAllLLMChanges: () => Promise<void>;
  acceptAllLLMChanges: () => Promise<void>;
  resetBills: () => Promise<void>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined)

export function BillsProvider({ children }: { children : ReactNode }) {
    // const [billStatuses, setBillStatuses] = useState<BillStatus[]>([])   
    const [bills, setBills] = useState<Bill[]>([]);
    const [tempBills, setTempBills] = useState<TempBill[]>([])
    const [error, setError] = useState<string | null>(null);
    const [loadingBills, setLoadingBills] = useState(false);    

    const acceptLLMChange = async(billId: string) => {
      const bill = bills.find(b => b.id === billId)
      if (!bill || !bill.llm_suggested) return;
      try {
        // Update server with the new status
        await updateBillStatusServerAction(billId, bill.current_status);
        
        // Update local state - remove LLM flags
        setBills(prevBills => 
          prevBills.map(b => 
            b.id === billId 
              ? { 
                  ...b, 
                  llm_suggested: false, 
                  previous_status: undefined 
                }
              : b
            )
          );

        // Remove the corresponding temp bill
        setTempBills(prevTempBills => 
          prevTempBills.filter(tb => tb.id !== billId)
        );
  
        toast({
          title: 'Change Accepted',
          description: `${bill.bill_number} status updated to ${bill.current_status}`,
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to accept the change. Please try again.',
          variant: 'destructive',
        });
      }
    };    

    const rejectLLMChange = async (billId: string) => {
      const bill = bills.find(b => b.id === billId)
      if (!bill || !bill.llm_suggested) return;

      setBills(prevBills => 
        prevBills.map(b =>
          b.id === billId
            ? {
                ...b,
                current_status: b.previous_status!,
                llm_suggested: false,
                previous_status: undefined
            }
          : b
        )
      )      

      // Remove the corresponding temp bill
      setTempBills(prevTempBills => 
        prevTempBills.filter(tb => tb.id !== billId)
      );

      toast({
        title: 'Change Rejected',
        description: `${bill.bill_number} reverted to ${bill.previous_status}`,
        variant: 'default',
      });
    }

    const rejectAllLLMChanges = async () => {
      const suggestedBills = bills.filter(b => b.llm_suggested);
      
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
      const suggestedBills = bills.filter(b => b.llm_suggested)

      for (const bill of suggestedBills) {
        await acceptLLMChange(bill.id);
      }
  
      toast({
        title: 'All Changes Accepted',
        description: `Accepted ${suggestedBills.length} AI suggestions`,
        variant: 'default',
      });
    }

    const resetBills = async() => {
      // Clear temp bills
      setTempBills([]);

      // Reset all bill states
      setBills(prevBills => 
        prevBills.map(bill => ({
          ...bill,
          llm_processing: false,
          llm_suggested: false,
          current_status: bill.previous_status || bill.current_status,
          previous_status: undefined
        }))
      );
    }
    
    useEffect(() => {
        setLoadingBills(true)
        setError(null);        
        const handler = setTimeout(async () => {
            try {
              const results = await getAllBills();
              setBills(results);
              console.log('successful results set in context')
              console.log(results)
            } catch (err) {
              console.error("Error searching bills:", err);
              setError("Failed to search bills.");
            } finally {
              setLoadingBills(false);    
                        
            }
          });
          
          return () => {
            clearTimeout(handler);
          };

    }, [])

    const value = useMemo(() => ({
      loadingBills, setLoadingBills, bills, setBills, acceptLLMChange, rejectLLMChange, tempBills, setTempBills, rejectAllLLMChanges, acceptAllLLMChanges, resetBills
    }), [bills, loadingBills, tempBills, acceptLLMChange, acceptAllLLMChanges, rejectLLMChange, rejectAllLLMChanges, resetBills])
    return (
        <BillsContext.Provider value={value}>
            {children}
        </BillsContext.Provider>
    )
}

export function useBills() {
    const context = useContext(BillsContext)
    if (context === undefined) {
        throw new Error('useCardUpdate must be used within a UpdateCardProvider');
      }
      return context;
}