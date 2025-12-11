import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Bills } from '../db/types';
import type { Bill } from '../types/legislation';

// Helper to safely convert Kysely Timestamp/Generated<Timestamp|null> to Date|null
function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function mapBillsToBill(raw: Bills): Bill {
  return {
    bill_number: raw.bill_number ?? '',
    bill_title: raw.bill_title ?? '',
    bill_url: raw.bill_url,
    committee_assignment: raw.committee_assignment ?? '',
    created_at: toDate(raw.created_at),
    current_status: typeof raw.current_status === 'string' ? raw.current_status : '',
    current_status_string: raw.current_status_string ?? '',
    description: raw.description ?? '',
    food_related: typeof raw.food_related === 'boolean' ? raw.food_related : null,
    id: typeof raw.id === 'string' ? raw.id : '',
    introducer: raw.introducer ?? '',
    nickname: raw.nickname ?? '',
    updated_at: toDate(raw.updated_at),
    // client-side fields
    updates: [],
    previous_status: undefined,
    llm_suggested: undefined,
    llm_processing: undefined,
  };
}