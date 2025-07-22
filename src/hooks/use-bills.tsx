'use client';

import { getAllBills, updateBillStatusServerAction } from '@/services/legislation';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Bill } from '@/types/legislation';
import { toast } from './use-toast';

interface BillsContextType {
    bills: Bill[]
    setBills: Dispatch<SetStateAction<Bill[]>>;
    acceptLLMChange: (billId: string) => Promise<void>;
    rejectLLMChange: (billId: string) => Promise<void>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined)

export function BillsProvider({ children }: { children : ReactNode }) {
    // const [billStatuses, setBillStatuses] = useState<BillStatus[]>([])   
    const [bills, setBills] = useState<Bill[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);    

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

      toast({
        title: 'Change Rejected',
        description: `${bill.bill_number} reverted to ${bill.previous_status}`,
        variant: 'default',
      });
    }
    
    useEffect(() => {
        setLoading(true)
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
              setLoading(false);              
            }
          });
          
          return () => {
            clearTimeout(handler);
          };
    }, [])



    return (
        <BillsContext.Provider value={{ bills, setBills, acceptLLMChange, rejectLLMChange }}>
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