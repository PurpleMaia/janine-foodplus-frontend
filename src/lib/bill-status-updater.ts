import { classifyBillStatus, isValidStatusTransition } from './bill-classifier';
import type { Database } from '@/types/database';

interface BillUpdateData {
  id: string;
  statusText: string;
  lastUpdate?: string;
  currentStatus?: string;
}

export async function updateBillStatus(
  db: Database,
  billData: BillUpdateData
) {
  const { id, statusText, lastUpdate, currentStatus } = billData;
  
  // Get current bill status
  const currentBill = await db
    .selectFrom('bills')
    .select(['current_status_str', 'id'])
    .where('id', '=', id)
    .executeTakeFirst();
  
  if (!currentBill) {
    throw new Error(`Bill with id ${id} not found`);
  }
  
  const currentBillStatus = currentStatus || currentBill.current_status_str;
  
  // Classify the new status
  const classification = classifyBillStatus(
    statusText,
    lastUpdate,
    currentBillStatus as any
  );
  
  // Validate the transition
  if (currentBillStatus && !isValidStatusTransition(currentBillStatus as any, classification.status)) {
    // Log potential misclassification
    await db
      .insertInto('ai_misclassifications')
      .values({
        bill_id: id,
        original_text: statusText,
        ai_classification: classification.status,
        correct_classification: currentBillStatus,
        confidence_score: classification.confidence,
        created_at: new Date(),
        reasoning: `Invalid status transition from ${currentBillStatus} to ${classification.status}. ${classification.reasoning}`
      })
      .execute();
    
    // Don't update the status if it's an invalid transition
    console.warn(`Invalid status transition for bill ${id}: ${currentBillStatus} -> ${classification.status}`);
    return {
      updated: false,
      reason: 'Invalid status transition',
      classification
    };
  }
  
  // Only update if the status actually changed and confidence is reasonable
  if (classification.status !== currentBillStatus && classification.confidence > 0.5) {
    await db.transaction().execute(async (trx) => {
      // Update the bill status
      await trx
        .updateTable('bills')
        .set({
          current_status_str: classification.status,
          updated_at: new Date()
        })
        .where('id', '=', id)
        .execute();
      
      // Add status update record
      await trx
        .insertInto('status_updates')
        .values({
          bill_id: id,
          status: classification.status,
          update_text: statusText,
          confidence_score: classification.confidence,
          created_at: new Date()
        })
        .execute();
    });
    
    return {
      updated: true,
      previousStatus: currentBillStatus,
      newStatus: classification.status,
      classification
    };
  }
  
  return {
    updated: false,
    reason: classification.confidence <= 0.5 ? 'Low confidence' : 'No status change',
    classification
  };
}