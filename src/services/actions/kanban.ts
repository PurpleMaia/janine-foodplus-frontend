'use server'

import { auth } from "@/lib/auth"
import { getAllBills } from "../db/legislation";
import { unstable_cache } from 'next/cache';

const getCachedBills = unstable_cache(
  async () => {
    const bills = await getAllBills();
    return bills;
  },
  ['kanban-bills'], // Cache key
  { revalidate: 60 * 5 }
);

export async function getKanbanBoardData() {
  const session = await auth();
  
  try {
    console.time('getCachedBills');
    const bills = await getCachedBills();
    console.timeEnd('getCachedBills');
    
    return {
      success: true as const,
      data: { bills }
    };
  } catch (error) {
    console.error('[KANBAN] Error:', error);
    return {
      success: false as const,
      error: 'Failed to fetch kanban board data'
    };
  }
}