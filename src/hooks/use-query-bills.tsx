import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Bill, StatusUpdate } from '@/types/legislation';
import { getAllBills, getUserAdoptedBills } from '@/services/legislation';

export const QUERY_KEYS = {
  bills: 'bills',
  billDetails: 'billDetails',
};

// export function useAllBills() {
//   return useQuery({
//     queryKey: [QUERY_KEYS.bills,],
//     queryFn: async () => {
//       const results = await getAllBills();
//       return results;
//     },
//   });
// }

export function useAdoptedBills(userID: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.bills, userID],
    queryFn: async () => {        
      const results = await getUserAdoptedBills(userID);
      return results;
    },
  });
}

// export function useBillDetails(billId: string) {
//   return useQuery({
//     queryKey: [QUERY_KEYS.billDetails, billId],
//     queryFn: async () => {
//       const response = await fetch(`/api/bills/${billId}`);
//       if (!response.ok) throw new Error('Failed to fetch bill details');
//       return response.json();
//     },
//   });
// }