import type { Bill, BillStatus, BillDraft, Introducer, NewsArticle } from '@/types/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';

// Helper function to create placeholder introducers
const createIntroducers = (names: string[]): Introducer[] =>
    names.map((name, index) => ({
        name,
        // Placeholder image URL using picsum.photos - requires next.config.js update if not already present
        imageUrl: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/40/40`,
    }));

// Helper function to create placeholder bill drafts
const createBillDrafts = (billId: string, versions: string[]): BillDraft[] =>
    versions.map((version, index) => ({
        version,
        htmlUrl: `/bills/${billId}/drafts/${version}.html`, // Placeholder links
        pdfUrl: `/bills/${billId}/drafts/${version}.pdf`, // Placeholder links
        date: new Date(2024, 5, 25 - index * 5), // Stagger dates
    }));

// Helper function to create placeholder news articles
const createNewsArticles = (count: number): NewsArticle[] =>
    Array.from({ length: count }, (_, index) => ({
        title: `Article Title ${index + 1} about the Bill`,
        url: `https://news.example.com/article${index + 1}`, // Placeholder links
        source: index % 2 === 0 ? 'Honolulu Star-Advertiser' : 'Civil Beat',
        date: new Date(2024, 5, 28 - index * 3),
    }));


// Mock data with diverse statuses and lastUpdated timestamps, including new fields
const mockBills: Bill[] = [
  {
      id: 'HB101',
      name: 'Clean Energy Act', // Keep for backward compat / simple display if needed
      shortName: 'Clean Energy',
      measureTitle: 'A Bill for an Act Relating to Clean Energy Standards.',
      reportTitle: 'Report on Clean Energy Standards (Committee on Energy)',
      description: 'Promotes renewable energy sources and sets new standards for emissions.',
      status: 'introduced',
      lastUpdated: new Date(2024, 5, 1),
      introducers: createIntroducers(['Rep. Aloha', 'Rep. Mahalo']),
      companionBill: 'SB202',
      package: 'Governor\'s Package',
      currentDraftPdfUrl: '/bills/HB101/drafts/latest.pdf', // Placeholder
      billDrafts: createBillDrafts('HB101', ['Orig.', 'HD1']),
      newsArticles: createNewsArticles(2),
  },
  {
      id: 'SB205',
      name: 'Education Reform Bill',
      shortName: 'Edu Reform',
      measureTitle: 'A Bill for an Act Relating to Public Education Funding.',
      description: 'Improves funding mechanisms and accountability for public schools.',
      status: 'scheduled1',
      lastUpdated: new Date(2024, 5, 10),
      introducers: createIntroducers(['Sen. Kokua', 'Sen. Pono']),
      currentDraftPdfUrl: '/bills/SB205/drafts/latest.pdf',
      billDrafts: createBillDrafts('SB205', ['Orig.']),
      newsArticles: createNewsArticles(1),
  },
  {
      id: 'HB330',
      name: 'Healthcare Access Initiative',
      shortName: 'Healthcare Access',
      measureTitle: 'A Bill for an Act Relating to Healthcare Accessibility.',
      description: 'Expands healthcare coverage options for underserved populations.',
      status: 'introduced',
      lastUpdated: new Date(2024, 5, 5),
      introducers: createIntroducers(['Rep. Laulima']),
      currentDraftPdfUrl: '/bills/HB330/drafts/latest.pdf',
      billDrafts: createBillDrafts('HB330', ['Orig.']),
      newsArticles: [],
 },
 {
      id: 'SB410',
      name: 'Infrastructure Investment Plan',
      shortName: 'Infrastructure Plan',
      measureTitle: 'A Bill for an Act Appropriating Funds for Infrastructure.',
      description: 'Funds critical infrastructure projects across the state, including roads and bridges.',
      status: 'deferred1',
      lastUpdated: new Date(2024, 5, 12),
      introducers: createIntroducers(['Sen. Alakai']),
      package: 'Senate Majority Package',
      currentDraftPdfUrl: '/bills/SB410/drafts/latest.pdf',
      billDrafts: createBillDrafts('SB410', ['Orig.', 'SD1']),
      newsArticles: createNewsArticles(3),
  },
  {
      id: 'HB500',
      name: 'Data Privacy Law',
      shortName: 'Data Privacy',
      measureTitle: 'A Bill for an Act Relating to Consumer Data Privacy.',
      description: 'Strengthens consumer data protection rights and regulations for businesses.',
      status: 'passedCommittees', // Updated status to test progress tracker
      lastUpdated: new Date(2024, 5, 20), // Updated date
      introducers: createIntroducers(['Rep. Malama', 'Rep. Kuleana']),
      currentDraftPdfUrl: '/bills/HB500/drafts/latest.pdf',
      billDrafts: createBillDrafts('HB500', ['Orig.', 'HD1', 'HD2']),
      newsArticles: createNewsArticles(1),
  },
   {
      id: 'SB621',
      name: 'Affordable Housing Act',
      shortName: 'Housing Act',
      measureTitle: 'A Bill for an Act Relating to Affordable Housing Development.',
      description: 'Provides incentives and zoning changes to encourage affordable housing.',
      status: 'governorSigns', // Updated status
      lastUpdated: new Date(2024, 5, 28), // Updated date
      introducers: createIntroducers(['Sen. Ohana']),
      currentDraftPdfUrl: '/bills/SB621/drafts/latest.pdf',
      billDrafts: createBillDrafts('SB621', ['Orig.', 'SD1', 'SD2', 'Final']),
      newsArticles: createNewsArticles(4),
   },
  // Add more mock bills as needed...
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
  // Ensure dates are Date objects (if they were strings)
   if (bill) {
     bill.lastUpdated = new Date(bill.lastUpdated);
     bill.billDrafts.forEach(draft => draft.date = new Date(draft.date));
     bill.newsArticles.forEach(article => article.date = new Date(article.date));
   }
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
    // Ensure dates are Date objects before sorting
    const processedBills = mockBills.map(bill => ({
        ...bill,
        lastUpdated: new Date(bill.lastUpdated),
        billDrafts: bill.billDrafts.map(draft => ({ ...draft, date: new Date(draft.date) })),
        newsArticles: bill.newsArticles.map(article => ({ ...article, date: new Date(article.date) })),
    }));
    // Sort by lastUpdated date descending (most recent first) before returning
    const sortedBills = [...processedBills].sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    return sortedBills; // Return a sorted copy
}


/**
 * Asynchronously searches for bills based on a query (ID, shortName, measureTitle, or description).
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
    bill.id.toLowerCase().includes(lowerCaseQuery) ||
    bill.shortName.toLowerCase().includes(lowerCaseQuery) ||
    bill.measureTitle.toLowerCase().includes(lowerCaseQuery) ||
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

    // Ensure dates are Date objects on return
    const updatedBill = { ...mockBills[billIndex] };
    updatedBill.lastUpdated = new Date(updatedBill.lastUpdated);
    updatedBill.billDrafts.forEach(draft => draft.date = new Date(draft.date));
    updatedBill.newsArticles.forEach(article => article.date = new Date(article.date));


    return updatedBill; // Return a copy of the updated bill
}
