'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserAdoptedBills, adoptBill, unadoptBill } from '@/services/db/legislation';
import { useToast } from '@/hooks/use-toast';
import type { Bill } from '@/types/legislation';
import { useBills } from '@/contexts/bills-context';

export function useAdoptedBills() {
  const { user } = useAuth();  
  const { setBills, refreshBills } = useBills(); // Manipulates the global bills state
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Handles the adoption of a bill by the current user. Calls adoptBill service and refreshes the bills list on success.
   * @param billUrl - The URL of the bill to adopt.
   * @returns A boolean indicating whether the adoption was successful.
   */
  const handleAdoptBill = async (billUrl: string) => {
    if (!user) return false;
    console.log('Adopting bill with URL:', billUrl);
    try {
      const success = await adoptBill(user.id, billUrl);
      if (success) {
        // Refresh the bills list after successful adoption
        console.log('Bill adopted successfully, refreshing bills...');
        await refreshBills();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adopting bill:', err);
      return false;
    }
  }

  /**
   * Handles the unadoption of a bill by the current user. Calls unadoptBill service and updates the global bills state on success.
   * @param billId - The ID of the bill to unadopt.
   * @returns A boolean indicating whether the unadoption was successful.
   */
  const handleUnadoptBill = useCallback(async (billId: string) => {
    if (!user) return false;
    try {
      const success = await unadoptBill(user.id, billId);
      if (success) {
        // Remove the bill from the local state
        setBills(prev => prev.filter(bill => bill.id !== billId));
        toast({
          title: 'Bill removed',
          description: 'The bill was successfully removed from your adopted list.',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error unadopting bill:', err);
      return false;
    }
  }, [user]);

  return {
    error,
    adoptBill: handleAdoptBill,
    unadoptBill: handleUnadoptBill,
  };
}
