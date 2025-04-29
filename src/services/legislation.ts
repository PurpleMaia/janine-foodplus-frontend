import type { Bill, BillStatus } from '@/types/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';

// Mock data with diverse statuses and lastUpdated timestamps
const mockBills: Bill[] = [
  { id: 'HB101', name: 'Clean Energy Act', description: 'Promotes renewable energy sources.', status: 'introduced', lastUpdated: new Date(2024, 5, 1) },
  { id: 'SB205', name: 'Education Reform Bill', description: 'Improves funding for public schools.', status: 'scheduled1', lastUpdated: new Date(2024, 5, 10) },
  { id: 'HB330', name: 'Healthcare Access Initiative', description: 'Expands healthcare coverage.', status: 'introduced', lastUpdated: new Date(2024, 5, 5) },
  { id: 'SB410', name: 'Infrastructure Investment Plan', description: 'Funds critical infrastructure projects.', status: 'deferred1', lastUpdated: new Date(2024, 5, 12) },
  { id: 'HB500', name: 'Data Privacy Law', description: 'Strengthens consumer data protection.', status: 'scheduled2', lastUpdated: new Date(2024, 5, 15) },
  { id: 'SB621', name: 'Affordable Housing Act', description: 'Addresses the housing crisis.', status: 'crossoverWaiting1', lastUpdated: new Date(2024, 5, 18) },
  { id: 'HB715', name: 'Small Business Relief', description: 'Provides support for small businesses.', status: 'introduced', lastUpdated: new Date(2024, 5, 8) },
  { id: 'SB808', name: 'Environmental Protection Update', description: 'Updates regulations for environmental safety.', status: 'passedCommittees', lastUpdated: new Date(2024, 5, 20) },
  { id: 'HB999', name: 'Election Security Bill', description: 'Enhances the security of elections.', status: 'conferenceAssigned', lastUpdated: new Date(2024, 5, 22) },
  { id: 'SB1010', name: 'Public Transportation Expansion', description: 'Improves public transit options.', status: 'transmittedGovernor', lastUpdated: new Date(2024, 5, 25) },
  { id: 'HB1120', name: 'Tax Code Simplification', description: 'Simplifies the state tax code.', status: 'governorSigns', lastUpdated: new Date(2024, 5, 28) },
  { id: 'SB1234', name: 'Animal Welfare Standards', description: 'Sets higher standards for animal welfare.', status: 'introduced', lastUpdated: new Date(2024, 5, 3) },
];


/**
 * Asynchronously retrieves bill information by ID.
 *
 * @param id The ID of the bill to retrieve.
 * @returns A promise that resolves to a Bill object or null if not found.
 */
export async function getBill(id: string): Promise<Bill | null> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  const bill = mockBills.find(b => b.id === id);
  return bill ? { ...bill } : null; // Return a copy
}

/**
 * Asynchronously retrieves all bills.
 *
 * @returns A promise that resolves to an array of all Bill objects.
 */
export async function getAllBills(): Promise<Bill[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // Sort by lastUpdated date descending (most recent first) before returning
    const sortedBills = [...mockBills].sort((a, b) => {
        const dateA = a.lastUpdated instanceof Date ? a.lastUpdated.getTime() : 0;
        const dateB = b.lastUpdated instanceof Date ? b.lastUpdated.getTime() : 0;
        return dateB - dateA;
    });
    return sortedBills; // Return a sorted copy
}


/**
 * Asynchronously searches for bills based on a query (name or description).
 *
 * @param query The search query.
 * @returns A promise that resolves to an array of matching Bill objects.
 */
export async function searchBills(query: string): Promise<Bill[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));

   // Get all bills, already sorted by lastUpdated
   const allBills = await getAllBills();

  if (!query) {
    return allBills; // Return all sorted bills if query is empty
  }

  const lowerCaseQuery = query.toLowerCase();
  return allBills.filter(bill =>
    bill.name.toLowerCase().includes(lowerCaseQuery) ||
    bill.description.toLowerCase().includes(lowerCaseQuery)
  );
}


/**
 * Asynchronously updates the status of a bill.
 * Also updates the lastUpdated timestamp.
 *
 * @param billId The ID of the bill to update.
 * @param newStatus The new status (Kanban column ID) for the bill.
 * @returns A promise that resolves to the updated Bill object or null if not found.
 */
export async function updateBillStatus(billId: string, newStatus: BillStatus): Promise<Bill | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const billIndex = mockBills.findIndex(b => b.id === billId);
    if (billIndex === -1) {
        console.error(`Bill with ID ${billId} not found for update.`);
        return null; // Bill not found
    }

    // Validate if newStatus is a valid column ID
    if (!KANBAN_COLUMNS.some(col => col.id === newStatus)) {
        console.error(`Invalid status update: ${newStatus}`);
        return null; // Invalid status
    }

    // Update the status and lastUpdated timestamp in the mock data
    mockBills[billIndex].status = newStatus;
    mockBills[billIndex].lastUpdated = new Date(); // Set to current time
    console.log(`Updated bill ${billId} to status ${newStatus} at ${mockBills[billIndex].lastUpdated}`);

    return { ...mockBills[billIndex] }; // Return a copy of the updated bill
}
```