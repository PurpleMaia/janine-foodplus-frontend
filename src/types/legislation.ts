import type { KANBAN_COLUMNS } from '@/lib/kanban-columns';

// Extract column IDs as possible statuses
export type BillStatus = (typeof KANBAN_COLUMNS)[number]['id'];

/**
 * Represents an introducer of a bill.
 */
export interface Introducer {
  name: string;
  /** URL to the introducer's picture. */
  imageUrl?: string;
}

/**
 * Represents a specific draft version of a bill.
 */
export interface BillDraft {
  version: string; // e.g., "HD1", "SD2", "Final"
  htmlUrl: string;
  pdfUrl: string;
  date: Date; // Date this draft was published
}

/**
 * Represents a news article related to the bill.
 */
export interface NewsArticle {
  title: string;
  url: string;
  source: string; // e.g., "Honolulu Star-Advertiser"
  date: Date;
}

/**
 * Represents a bill in the legislative process.
 */
export interface Bill {
  id: string;  
  bill_url: string;
  description: string; 
  current_status: string;  
  current_status_string: string;
  created_at: Date;
  updated_at: Date;
  committee_assignment: string;
  bill_title: string;  
  introducers: string;
  bill_number: string;
  updates?: StatusUpdate[]
  previous_status?: string;  
  llm_suggested?: boolean;  
  llm_processing?: boolean;  
}

export interface TempBill {
  id: string,  
  current_status: string
  suggested_status: string   
  target_idx: number
}

export interface StatusUpdate {
  id: string;
  chamber: string;
  date: string;
  text: string
}