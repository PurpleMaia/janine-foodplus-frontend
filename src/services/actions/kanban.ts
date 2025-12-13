'use server'

import { auth } from "@/lib/auth"
import { getAllBills } from "../db/legislation";

export async function getKanbanBoardData() {
    const session = await auth()

    const user = session?.user;

    try {
        // PUBLIC VIEW (still show all bills, but no user-specific data)
        if (!user) {
            console.log('[KANBAN] No user session found (PUBLIC)');            
            const bills = await getAllBills() 
            return {
                success: true as const,
                data: {                    
                    bills
                }
            };   
        }     

        // LOGGED-IN VIEW (admin or supervisor)
        const bills = await getAllBills() 
        return {
            success: true as const,
            data: {                    
                bills
            }
        }; 
    } catch (error) {
        console.error('[KANBAN] Error fetching kanban board data:', error);
        return {
            success: false as const,
            error: 'Failed to fetch kanban board data'
        };
    }

}