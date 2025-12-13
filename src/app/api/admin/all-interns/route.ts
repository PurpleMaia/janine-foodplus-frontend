import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '../../../../db/kysely/client';
import { ApiError, Errors } from '@/lib/errors';

interface InternWithBills {
  id: string;
  email: string;
  username: string;
  created_at: string;
  account_status: string;
  supervisor_id: string | null;
  supervisor_email: string | null;
  supervisor_username: string | null;
  adopted_bills: Array<{
    bill_id: string;
    bill_number: string;
    bill_title: string;
    current_status: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);    
    const user = await validateSession(session_token);
    if (!user || user.role !== 'admin') {
      console.error('[ALL INTERNS] Unauthorized access attempt by user:', user?.email || 'unknown', '(ADMIN ONLY)');
      throw Errors.UNAUTHORIZED;
    }

    console.log('📋 [ALL INTERNS] Loading all interns with bills...');

    // Get all interns (users with role 'user')
    // Note: Fetching all users with role 'user' regardless of account_status for admin view
    const interns = await db
      .selectFrom('user')
      .select(['id', 'email', 'username', 'created_at', 'account_status'])
      .innerJoin('supervisor_users', 'user.id', 'supervisor_users.user_id') // Ensure they have a supervisor
      .where('role', '=', 'user')
      .execute();

    console.log(`📋 [ALL INTERNS] Found ${interns.length} users with role 'user'`);
    // interns.forEach((intern: any, idx: number) => {
    //   console.log(`  [${idx + 1}] ${intern.username} (${intern.email}) - Status: ${intern.account_status}`);
    // });

    // Get supervisor relationships
    console.log('📋 [ALL INTERNS] Fetching supervisor relationships...');
    let supervisorRelations: Array<{
      user_id: string;
      supervisor_id: string;
      supervisor_email: string;
      supervisor_username: string;
    }> = [];
    try {
      supervisorRelations = await db
        .selectFrom('supervisor_users')
        .innerJoin('user as supervisor', 'supervisor_users.supervisor_id', 'supervisor.id')
        .select([
          'supervisor_users.user_id',
          'supervisor_users.supervisor_id',
          'supervisor.email as supervisor_email',
          'supervisor.username as supervisor_username'
        ])
        .execute();
      console.log(`📋 [ALL INTERNS] Found ${supervisorRelations.length} supervisor relationships`);
    } catch (joinError) {
      console.error('❌ [ALL INTERNS] Error fetching supervisor relationships:', joinError);
      // Continue without supervisor relationships if the join fails
      supervisorRelations = [];
    }

    const supervisorMap = new Map<string, { id: string; email: string; username: string }>();
    supervisorRelations.forEach((rel: any) => {
      supervisorMap.set(rel.user_id, {
        id: rel.supervisor_id,
        email: rel.supervisor_email,
        username: rel.supervisor_username
      });
    });

    // Get all bills adopted by interns
    console.log('📋 [ALL INTERNS] Fetching bills adopted by interns...');
    let internBills: Array<{
      user_id: string | null;
      bill_id: string;
      bill_number: string | null;
      bill_title: string | null;
      current_status: string | null;
    }> = [];
    try {
      internBills = await db
        .selectFrom('user_bills')
        .innerJoin('bills', 'user_bills.bill_id', 'bills.id')
        .select([
          'user_bills.user_id',
          'bills.id as bill_id',
          'bills.bill_number',
          'bills.bill_title',
          'bills.current_status'
        ])
        .execute();
      console.log(`📋 [ALL INTERNS] Found ${internBills.length} bills adopted by interns`);
    } catch (billsError) {
      console.error('❌ [ALL INTERNS] Error fetching intern bills:', billsError);
      // Continue without bills if the query fails
      internBills = [];
    }

    // Group bills by intern
    const billsByIntern = new Map<string, Array<{
      bill_id: string;
      bill_number: string;
      bill_title: string;
      current_status: string;
    }>>();

    internBills.forEach((ib: any) => {
      if (!billsByIntern.has(ib.user_id)) {
        billsByIntern.set(ib.user_id, []);
      }
      billsByIntern.get(ib.user_id)!.push({
        bill_id: ib.bill_id,
        bill_number: ib.bill_number,
        bill_title: ib.bill_title,
        current_status: ib.current_status
      });
    });

    // Combine all data
    const internsWithBills: InternWithBills[] = interns.map((intern: any) => {
      const supervisor = supervisorMap.get(intern.id);
      return {
        id: intern.id,
        email: intern.email,
        username: intern.username,
        created_at: intern.created_at,
        account_status: intern.account_status,
        supervisor_id: supervisor?.id || null,
        supervisor_email: supervisor?.email || null,
        supervisor_username: supervisor?.username || null,
        adopted_bills: billsByIntern.get(intern.id) || []
      };
    });

    console.log(`✅ [ALL INTERNS] Returning ${internsWithBills.length} interns with bills`);
    return NextResponse.json({ success: true, interns: internsWithBills });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[ADMIN/ALL-INTERNS]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}

