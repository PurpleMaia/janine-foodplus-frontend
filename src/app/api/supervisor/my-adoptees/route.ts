import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../../db/kysely/client';
import { sql } from 'kysely';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Supervisor access only' }, { status: 403 });
    }

    // Get adopted interns for this supervisor - two simple queries
    const super_user_records = await db
      .selectFrom('supervisor_users')
      .selectAll()
      .where('supervisor_id', '=', user.id)
      .execute();

    const userIds = super_user_records.map((su: any) => su.user_id);
    
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, adoptees: [] });
    }

    const adoptees = await db
      .selectFrom('user')
      .select(['id', 'email', 'username'])
      .where('id', 'in', userIds)
      .execute();

    // Map to include adopted_at
    const adopteesWithDates = adoptees.map((adoptee) => {
      const record = super_user_records.find((su: any) => su.user_id === adoptee.id);
      return {
        id: adoptee.id,
        email: adoptee.email,
        username: adoptee.username,
        adopted_at: record ? record.created_at : new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, adoptees: adopteesWithDates });
  } catch (error) {
    console.error('Error fetching adoptees:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch adoptees' }, { status: 500 });
  }
}

