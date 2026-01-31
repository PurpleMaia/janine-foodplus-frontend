// Bill status classification utility
export enum BillStatus {
  INTRODUCED = 'introduced',
  FIRST_READING_SCHEDULED = 'scheduled_first_reading',
  FIRST_READING_PASSED = 'first_reading_passed',
  COMMITTEE_REVIEW = 'committee_review',
  SECOND_READING = 'second_reading',
  THIRD_READING = 'third_reading',
  PASSED = 'passed',
  FAILED = 'failed',
  DEFERRED = 'deferred'
}

export interface BillStatusResult {
  status: BillStatus;
  confidence: number;
  rawText: string;
}

/**
 * Classifies bill status from raw legislative text
 * Fixed logic to prevent incorrect "scheduled for 1st reading" classifications
 */
export function classifyBillStatus(rawStatusText: string): BillStatusResult {
  const text = rawStatusText.toLowerCase().trim();
  
  // Common patterns that indicate first reading is scheduled
  const firstReadingScheduledPatterns = [
    /scheduled.*first.*reading/,
    /first.*reading.*scheduled/,
    /pending.*first.*reading/
  ];
  
  // Common patterns that indicate first reading has already occurred
  const firstReadingCompletedPatterns = [
    /first.*reading.*passed/,
    /passed.*first.*reading/,
    /first.*reading.*completed/,
    /referred.*to.*committee.*after.*first.*reading/
  ];
  
  // Patterns for other statuses to avoid misclassification
  const committeePatterns = [
    /committee.*hearing/,
    /in.*committee/,
    /committee.*review/,
    /referred.*to.*committee/
  ];
  
  const secondReadingPatterns = [
    /second.*reading/,
    /2nd.*reading/
  ];
  
  const thirdReadingPatterns = [
    /third.*reading/,
    /3rd.*reading/,
    /final.*reading/
  ];
  
  // Check for completed first reading first (higher precedence)
  for (const pattern of firstReadingCompletedPatterns) {
    if (pattern.test(text)) {
      return {
        status: BillStatus.FIRST_READING_PASSED,
        confidence: 0.9,
        rawText: rawStatusText
      };
    }
  }
  
  // Check for committee review (should not be classified as first reading)
  for (const pattern of committeePatterns) {
    if (pattern.test(text)) {
      return {
        status: BillStatus.COMMITTEE_REVIEW,
        confidence: 0.85,
        rawText: rawStatusText
      };
    }
  }
  
  // Check for second reading
  for (const pattern of secondReadingPatterns) {
    if (pattern.test(text)) {
      return {
        status: BillStatus.SECOND_READING,
        confidence: 0.9,
        rawText: rawStatusText
      };
    }
  }
  
  // Check for third reading
  for (const pattern of thirdReadingPatterns) {
    if (pattern.test(text)) {
      return {
        status: BillStatus.THIRD_READING,
        confidence: 0.9,
        rawText: rawStatusText
      };
    }
  }
  
  // Only then check for scheduled first reading
  for (const pattern of firstReadingScheduledPatterns) {
    if (pattern.test(text)) {
      return {
        status: BillStatus.FIRST_READING_SCHEDULED,
        confidence: 0.8,
        rawText: rawStatusText
      };
    }
  }
  
  // Check for passed/failed status
  if (/passed|approved/.test(text) && !/first.*reading/.test(text)) {
    return {
      status: BillStatus.PASSED,
      confidence: 0.85,
      rawText: rawStatusText
    };
  }
  
  if (/failed|rejected|defeated/.test(text)) {
    return {
      status: BillStatus.FAILED,
      confidence: 0.85,
      rawText: rawStatusText
    };
  }
  
  if (/deferred|postponed|held/.test(text)) {
    return {
      status: BillStatus.DEFERRED,
      confidence: 0.8,
      rawText: rawStatusText
    };
  }
  
  // Default to introduced if no other pattern matches
  return {
    status: BillStatus.INTRODUCED,
    confidence: 0.3,
    rawText: rawStatusText
  };
}

/**
 * Validates a bill status classification and flags potential misclassifications
 */
export function validateBillStatusClassification(
  currentStatus: BillStatus,
  previousStatus: BillStatus | null,
  statusText: string
): { isValid: boolean; reason?: string } {
  // Bills shouldn't go backwards in the legislative process
  const statusOrder = [
    BillStatus.INTRODUCED,
    BillStatus.FIRST_READING_SCHEDULED,
    BillStatus.FIRST_READING_PASSED,
    BillStatus.COMMITTEE_REVIEW,
    BillStatus.SECOND_READING,
    BillStatus.THIRD_READING,
    BillStatus.PASSED
  ];
  
  if (previousStatus) {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const previousIndex = statusOrder.indexOf(previousStatus);
    
    // Allow some flexibility for deferred/failed statuses
    if (currentStatus === BillStatus.DEFERRED || currentStatus === BillStatus.FAILED) {
      return { isValid: true };
    }
    
    if (currentIndex < previousIndex && currentIndex !== -1 && previousIndex !== -1) {
      return {
        isValid: false,
        reason: `Bill status appears to have moved backwards from ${previousStatus} to ${currentStatus}`
      };
    }
  }
  
  // Specific validation for first reading scheduled
  if (currentStatus === BillStatus.FIRST_READING_SCHEDULED) {
    const text = statusText.toLowerCase();
    
    // If it mentions committee, it's likely past first reading
    if (text.includes('committee') && !text.includes('scheduled')) {
      return {
        isValid: false,
        reason: 'Status mentions committee activity but classified as first reading scheduled'
      };
    }
    
    // If it mentions "passed" or "completed" first reading, it shouldn't be scheduled
    if (text.includes('passed') || text.includes('completed')) {
      return {
        isValid: false,
        reason: 'Status indicates first reading completed but classified as scheduled'
      };
    }
  }
  
  return { isValid: true };
}