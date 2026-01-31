import { classifyBillStatus, validateBillStatusClassification, BillStatus } from './billStatusClassifier';
import { db } from '@/db';

export interface BillStatusUpdate {
  billId: string;
  newStatus: BillStatus;
  statusText: string;
  confidence: number;
  isManualOverride?: boolean;
}

/**
 * Updates bill status with improved validation and misclassification tracking
 */
export async function updateBillStatus(update: BillStatusUpdate) {
  try {
    // Get current bill status
    const currentBill = await db
      .selectFrom('bills')
      .select(['id', 'current_status_str', 'status'])
      .where('id', '=', update.billId)
      .executeTakeFirst();
    
    if (!currentBill) {
      throw new Error(`Bill with ID ${update.billId} not found`);
    }
    
    // Validate the status classification
    const validation = validateBillStatusClassification(
      update.newStatus,
      currentBill.status as BillStatus | null,
      update.statusText
    );
    
    // If validation fails and this isn't a manual override, flag for review
    if (!validation.isValid && !update.isManualOverride) {
      console.warn(`Potential misclassification detected for bill ${update.billId}: ${validation.reason}`);
      
      // Log to misclassification tracking table
      await db
        .insertInto('ai_misclassification_tracking')
        .values({
          bill_id: update.billId,
          original_status: currentBill.status || 'unknown',
          suggested_status: update.newStatus,
          status_text: update.statusText,
          confidence_score: update.confidence,
          reason: validation.reason || 'Validation failed',
          created_at: new Date().toISOString()
        })
        .execute();
      
      // Don't update the status, keep current one
      return {
        success: false,
        reason: 'Status update blocked due to validation failure',
        validationError: validation.reason
      };
    }
    
    // Update the bill status
    await db.transaction().execute(async (trx) => {
      // Update the bills table
      await trx
        .updateTable('bills')
        .set({
          status: update.newStatus,
          current_status_str: update.statusText,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', update.billId)
        .execute();
      
      // Add status update record
      await trx
        .insertInto('status_updates')
        .values({
          bill_id: update.billId,
          old_status: currentBill.status || 'unknown',
          new_status: update.newStatus,
          status_text: update.statusText,
          confidence: update.confidence,
          is_manual_override: update.isManualOverride || false,
          created_at: new Date().toISOString()
        })
        .execute();
    });
    
    return {
      success: true,
      previousStatus: currentBill.status,
      newStatus: update.newStatus
    };
    
  } catch (error) {
    console.error('Error updating bill status:', error);
    throw error;
  }
}

/**
 * Batch process bill status updates with validation
 */
export async function batchUpdateBillStatuses(rawStatusData: Array<{ billId: string; statusText: string }>) {
  const results = {
    successful: 0,
    failed: 0,
    flagged: 0,
    errors: [] as string[]
  };
  
  for (const item of rawStatusData) {
    try {
      const classification = classifyBillStatus(item.statusText);
      
      const updateResult = await updateBillStatus({
        billId: item.billId,
        newStatus: classification.status,
        statusText: classification.rawText,
        confidence: classification.confidence
      });
      
      if (updateResult.success) {
        results.successful++;
      } else {
        results.flagged++;
      }
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Bill ${item.billId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return results;
}