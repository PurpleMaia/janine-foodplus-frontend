'use client';

import { getAllBills } from '@/services/legislation';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Bill } from '@/types/legislation';

interface BillsContextType {
    bills: Bill[]
    setBills: Dispatch<SetStateAction<Bill[]>>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined)

export function BillsProvider({ children }: { children : ReactNode }) {
    // const [billStatuses, setBillStatuses] = useState<BillStatus[]>([])   
    const [bills, setBills] = useState<Bill[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    
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
        <BillsContext.Provider value={{ bills, setBills }}>
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