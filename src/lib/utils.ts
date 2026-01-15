import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Bills } from '../db/types';
import type { Bill } from '../types/legislation';
import { KANBAN_COLUMNS } from "./kanban-columns";

// Helper to safely convert Kysely Timestamp/Generated<Timestamp|null> to Date|null
export function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatBillStatusName(status: string | null): string {
  if (!status) return 'No Assigned Status';
  return KANBAN_COLUMNS.find(col => col.id === status)?.title || status;
}