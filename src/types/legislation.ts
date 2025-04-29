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
  /**
   * The unique identifier for the bill (e.g., "HB101").
   */
  id: string;
  /**
   * The short name or colloquial title of the bill.
   */
  shortName: string;
  /**
   * The official measure title of the bill.
   */
  measureTitle: string;
   /**
   * The official report title (if applicable).
   */
  reportTitle?: string;
  /**
   * A brief description of the bill's purpose.
   */
  description: string;
  /**
   * The current status of the bill, corresponding to a Kanban column ID.
   */
  status: BillStatus;
  /**
   * Timestamp or string indicating the last update time.
   */
  lastUpdated: string | Date; // Keep this for sorting/display on card
   /**
    * List of legislators who introduced the bill.
    */
   introducers: Introducer[];
   /**
    * Identifier for a companion bill, if any.
    */
   companionBill?: string;
   /**
    * Identifier for any legislative package this bill belongs to.
    */
   package?: string;
   /**
    * URL to the latest PDF version of the bill text.
    */
   currentDraftPdfUrl: string;
   /**
    * List of historical bill drafts.
    */
   billDrafts: BillDraft[];
   /**
    * List of news articles related to the bill.
    */
   newsArticles: NewsArticle[];

   // Deprecated/Redundant fields (based on new fields added)
   /** @deprecated Use shortName or measureTitle instead */
   name: string;
}
