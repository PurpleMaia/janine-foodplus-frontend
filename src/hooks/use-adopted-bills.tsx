'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserAdoptedBills, adoptBill, unadoptBill } from '@/services/legislation';
import { useToast } from '@/hooks/use-toast';
import type { Bill } from '@/types/legislation';
import { useBills } from '@/contexts/bills-context';

export function useAdoptedBills() {
  const { user } = useAuth();  
  const { setBills, setLoadingBills: setLoading, refreshBills } = useBills(); // Set to the main bills context
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAdoptBill = useCallback(async (billUrl: string) => {
    if (!user) return false;

    try {
      const success = await adoptBill(user.id, billUrl);
      if (success) {
        // Refresh the bills list after successful adoption
        await refreshBills()      
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adopting bill:', err);
      return false;
    }
  }, [user, refreshBills]);

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
