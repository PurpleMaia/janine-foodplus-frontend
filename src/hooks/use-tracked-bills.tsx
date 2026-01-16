'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/contexts/auth-context';
import { trackBill, untrackBill } from '@/services/data/legislation';
import { getBillTags } from '@/services/data/tags';
import { useToast } from '@/hooks/use-toast';
import { useBills } from '@/hooks/contexts/bills-context';

export function useTrackedBills() {
  const { user } = useAuth();
  const { setBills, addBill, updateBill } = useBills();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Handles the tracking of a bill by the current user. Calls trackBill service and adds the bill to the list on success.
   * @param billUrl - The URL of the bill to track.
   * @returns A boolean indicating whether the tracking was successful.
   */
  const handleTrackBill = async (billUrl: string) => {
    if (!user) return false;
    try {
      const trackedBill = await trackBill(user.id, billUrl);
      if (trackedBill) {
        // Add the bill to the list
        console.log('Bill tracked successfully, adding to list...');
        addBill(trackedBill);

        // Fetch tags for the newly tracked bill
        console.log('Fetching tags for newly tracked bill...');
        const tags = await getBillTags(trackedBill.id);
        updateBill(trackedBill.id, { tags });

        toast({
          title: 'Bill tracked',
          description: 'The bill was successfully added to your tracked list.',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error tracking bill:', err);
      return false;
    }
  }

  /**
   * Handles the untracking of a bill by the current user. Calls unadoptBill service and updates the global bills state on success.
   * @param billId - The ID of the bill to untrack.
   * @returns A boolean indicating whether the untracking was successful.
   */
  const handleUntrackBill = useCallback(async (billId: string) => {
    if (!user) return false;
    try {
      const success = await untrackBill(user.id, billId);
      if (success) {
        // Remove the bill from the local state
        setBills(prev => prev.filter(bill => bill.id !== billId));
        toast({
          title: 'Bill removed',
          description: 'The bill was successfully removed from your tracked list.',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error untracking bill:', err);
      return false;
    }
  }, [user]);

  return {
    error,
    trackBill: handleTrackBill,
    untrackBill: handleUntrackBill,
  };
}
