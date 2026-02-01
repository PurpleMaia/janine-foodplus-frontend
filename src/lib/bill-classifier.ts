import { z } from 'zod';

// Status classification schema
const BillStatusSchema = z.enum([
  'introduced',
  'scheduled_for_1st_reading',
  'passed_1st_reading',
  'scheduled_for_2nd_reading',
  'passed_2nd_reading',
  'scheduled_for_3rd_reading',
  'passed_3rd_reading',
  'sent_to_governor',
  'signed_into_law',
  'vetoed',
  'died_in_committee'
]);

type BillStatus = z.infer<typeof BillStatusSchema>;

interface ClassificationResult {
  status: BillStatus;
  confidence: number;
  reasoning?: string;
}

// Common patterns that indicate bills should NOT be classified as "scheduled for 1st reading"
const NOT_FIRST_READING_PATTERNS = [
  /passed.*first.*reading/i,
  /second.*reading/i,
  /third.*reading/i,
  /final.*passage/i,
  /sent.*to.*governor/i,
  /signed.*into.*law/i,
  /vetoed/i,
  /died.*in.*committee/i,
  /committee.*passed/i,
  /amended/i,
  /conference.*committee/i
];

// Patterns that specifically indicate first reading scheduling
const FIRST_READING_SCHEDULED_PATTERNS = [
  /scheduled.*first.*reading/i,
  /calendar.*first.*reading/i,
  /first.*reading.*\d{1,2}\/\d{1,2}/i, // Date patterns
  /upcoming.*first.*reading/i
];

export function classifyBillStatus(
  statusText: string,
  lastUpdateText?: string,
  currentStatus?: BillStatus
): ClassificationResult {
  const combinedText = `${statusText} ${lastUpdateText || ''}`.toLowerCase().trim();
  
  // First, check if bill should NOT be classified as first reading
  for (const pattern of NOT_FIRST_READING_PATTERNS) {
    if (pattern.test(combinedText)) {
      // If it matches a "not first reading" pattern, determine the actual status
      if (/passed.*first.*reading|first.*reading.*passed/i.test(combinedText)) {
        return {
          status: 'passed_1st_reading',
          confidence: 0.9,
          reasoning: 'Bill has already passed first reading'
        };
      }
      if (/second.*reading/i.test(combinedText)) {
        return {
          status: /scheduled.*second|second.*scheduled/i.test(combinedText) 
            ? 'scheduled_for_2nd_reading' 
            : 'passed_2nd_reading',
          confidence: 0.85,
          reasoning: 'Bill is in second reading phase'
        };
      }
      if (/third.*reading/i.test(combinedText)) {
        return {
          status: /scheduled.*third|third.*scheduled/i.test(combinedText)
            ? 'scheduled_for_3rd_reading'
            : 'passed_3rd_reading',
          confidence: 0.85,
          reasoning: 'Bill is in third reading phase'
        };
      }
      // Add other status determinations...
    }
  }
  
  // Now check for actual first reading scheduling
  const isScheduledForFirst = FIRST_READING_SCHEDULED_PATTERNS.some(pattern => 
    pattern.test(combinedText)
  );
  
  if (isScheduledForFirst) {
    // Additional validation - make sure it's not already past first reading
    if (currentStatus && ['passed_1st_reading', 'scheduled_for_2nd_reading', 'passed_2nd_reading', 'scheduled_for_3rd_reading', 'passed_3rd_reading'].includes(currentStatus)) {
      return {
        status: currentStatus,
        confidence: 0.95,
        reasoning: 'Bill status should not regress to first reading'
      };
    }
    
    return {
      status: 'scheduled_for_1st_reading',
      confidence: 0.8,
      reasoning: 'Text indicates scheduling for first reading'
    };
  }
  
  // Default case - if we can't determine, keep current status or default to introduced
  return {
    status: currentStatus || 'introduced',
    confidence: 0.3,
    reasoning: 'Unable to determine status from text, maintaining current status'
  };
}

// Function to validate status transitions
export function isValidStatusTransition(from: BillStatus, to: BillStatus): boolean {
  const statusOrder: BillStatus[] = [
    'introduced',
    'scheduled_for_1st_reading',
    'passed_1st_reading',
    'scheduled_for_2nd_reading',
    'passed_2nd_reading',
    'scheduled_for_3rd_reading',
    'passed_3rd_reading',
    'sent_to_governor',
    'signed_into_law'
  ];
  
  const fromIndex = statusOrder.indexOf(from);
  const toIndex = statusOrder.indexOf(to);
  
  // Allow transitions forward or staying the same
  // Don't allow backwards transitions (regression)
  if (toIndex >= fromIndex) return true;
  
  // Special cases where backwards transitions might be valid
  // (e.g., bill gets pulled back to committee)
  const allowedBackwardTransitions: Array<[BillStatus, BillStatus]> = [
    ['scheduled_for_1st_reading', 'introduced'],
    ['scheduled_for_2nd_reading', 'passed_1st_reading'],
    ['scheduled_for_3rd_reading', 'passed_2nd_reading']
  ];
  
  return allowedBackwardTransitions.some(([validFrom, validTo]) => 
    from === validFrom && to === validTo
  );
}