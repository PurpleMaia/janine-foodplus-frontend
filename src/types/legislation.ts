import type { KANBAN_COLUMNS } from '@/lib/kanban-columns';

// Extract column IDs as possible statuses
export type BillStatus = (typeof KANBAN_COLUMNS)[number]['id'];

/**
 * Represents a bill in the legislative process.
 */
export interface Bill {
  /**
   * The unique identifier for the bill.
   */
  id: string;
  /**
   * The name or title of the bill.
   */
  name: string;
  /**
   * A brief description of the bill.
   */
  description: string;
  /**
   * The current status of the bill, corresponding to a Kanban column ID.
   */
  status: BillStatus;
  /**
   * Optional: Timestamp or string indicating the last update time.
   */
  lastUpdated?: string | Date;
}
```