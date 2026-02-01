import { NextRequest, NextResponse } from 'next/server';
import { updateBillStatus } from '@/lib/bill-status-updater';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId, statusText, lastUpdate } = body;
    
    if (!billId || !statusText) {
      return NextResponse.json(
        { error: 'Missing required fields: billId, statusText' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    
    const result = await updateBillStatus(db, {
      id: billId,
      statusText,
      lastUpdate
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error updating bill status:', error);
    return NextResponse.json(
      { error: 'Failed to update bill status' },
      { status: 500 }
    );
  }
}