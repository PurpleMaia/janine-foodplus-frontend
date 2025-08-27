'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserAdoptedBills, adoptBill, unadoptBill } from '@/services/legislation';
import type { Bill } from '@/types/legislation';

export function useAdoptedBills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdoptedBills = useCallback(async () => {
    if (!user) {
      console.log('No user, setting bills to empty array');
      setBills([]);
      return;
    }

    console.log('fetchAdoptedBills called for user:', user.id);
    console.log('User object:', user);
    setLoading(true);
    setError(null);
    
    try {
      const adoptedBills = await getUserAdoptedBills(user.id);
      console.log('Fetched adopted bills:', adoptedBills.length, adoptedBills);
      setBills(adoptedBills);
    } catch (err) {
      setError('Failed to fetch adopted bills');
      console.error('Error fetching adopted bills:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleAdoptBill = useCallback(async (billUrl: string) => {
    if (!user) return false;

    try {
      const success = await adoptBill(user.id, billUrl);
      if (success) {
        // Refresh the bills list after successful adoption
        await fetchAdoptedBills();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adopting bill:', err);
      return false;
    }
  }, [user, fetchAdoptedBills]);

  const handleUnadoptBill = useCallback(async (billId: string) => {
    if (!user) return false;

    try {
      const success = await unadoptBill(user.id, billId);
      if (success) {
        // Remove the bill from the local state
        setBills(prev => prev.filter(bill => bill.id !== billId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error unadopting bill:', err);
      return false;
    }
  }, [user]);

  // Fetch bills when user changes
  useEffect(() => {
    fetchAdoptedBills();
  }, [fetchAdoptedBills]);

  return {
    bills,
    loading,
    error,
    setLoading,
    setBills,
    adoptBill: handleAdoptBill,
    unadoptBill: handleUnadoptBill,
    refreshBills: fetchAdoptedBills,
  };
}
