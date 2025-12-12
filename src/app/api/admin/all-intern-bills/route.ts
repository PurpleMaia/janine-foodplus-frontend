import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '../../../../db/kysely/client';
import { mapBillsToBill } from '@/lib/utils';
import { Bills } from '../../../../db/types';

interface InternBill {
  bill: any; // Bill object
  adopted_by: Array<{
    intern_id: string;
    intern_email: string;
    intern_username: string;
    supervisor_id: string | null;
    supervisor_email: string | null;
    supervisor_username: string | null;
    adopted_at: string;
  }>;
  pending_proposals: Array<{
    proposal_id: string;
    intern_id: string;
    intern_email: string;
    current_status: string;
    suggested_status: string;
    proposed_at: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    console.log('📋 [ADMIN] Loading all bills adopted by interns...');

    // Get all bills adopted by interns (users with role 'user')
    console.log('📋 [ADMIN] Fetching bills adopted by interns...');
    let rawData: Array<{
      bill_number: string | null;
      bill_title: string | null;
      bill_url: string;
      committee_assignment: string | null;
      created_at: Date | string | null;
      current_status: string | null;
      current_status_string: string;
      description: string;
      food_related: boolean | null;
      id: string;
      introducer: string | null;
      nickname: string | null;
      updated_at: Date | string | null;
      intern_id: string | null;
      adopted_at: Date | string | null;
      status_update_id: string | null;
      statustext: string | null;
      date: string | null;
      chamber: string | null;
    }> = [];
    try {
      rawData = await db
        .selectFrom('bills as b')
        .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id')
        .innerJoin('user as intern', 'ub.user_id', 'intern.id')
        .leftJoin('status_updates as su', 'b.id', 'su.bill_id')
        .where('intern.role', '=', 'user')
        .select([
          'b.bill_number',
          'b.bill_title',
          'b.bill_url',
          'b.committee_assignment',
          'b.created_at',
          'b.current_status',
          'b.current_status_string',
          'b.description',
          'b.food_related',
          'b.id',
          'b.introducer',
          'b.nickname',
          'b.updated_at',
          'ub.user_id as intern_id',
          'ub.adopted_at',
          'su.id as status_update_id',
          'su.statustext',
          'su.date',
          'su.chamber'
        ])
        .orderBy('b.updated_at', 'desc')
        .orderBy('su.date', 'desc')
        .execute();
      console.log(`📋 [ADMIN] Found ${rawData.length} bill records`);
    } catch (billsError) {
      console.error('❌ [ADMIN] Error fetching bills:', billsError);
      throw billsError;
    }

    // Get supervisor relationships for interns
    console.log('📋 [ADMIN] Fetching supervisor relationships...');
    let supervisorRelations: Array<{
      intern_id: string;
      supervisor_id: string;
      supervisor_email: string;
      supervisor_username: string;
    }> = [];
    try {
      supervisorRelations = await db
        .selectFrom('supervisor_users')
        .innerJoin('user as supervisor', 'supervisor_users.supervisor_id', 'supervisor.id')
        .select([
          'supervisor_users.user_id as intern_id',
          'supervisor_users.supervisor_id',
          'supervisor.email as supervisor_email',
          'supervisor.username as supervisor_username'
        ])
        .execute();
      console.log(`📋 [ADMIN] Found ${supervisorRelations.length} supervisor relationships`);
    } catch (supervisorError) {
      console.error('❌ [ADMIN] Error fetching supervisor relationships:', supervisorError);
      // Continue without supervisor relationships if the join fails
      supervisorRelations = [];
    }

    const supervisorMap = new Map<string, { id: string; email: string; username: string }>();
    supervisorRelations.forEach((rel: any) => {
      supervisorMap.set(rel.intern_id, {
        id: rel.supervisor_id,
        email: rel.supervisor_email,
        username: rel.supervisor_username
      });
    });

    // Get intern details
    console.log('📋 [ADMIN] Fetching intern details...');
    let internDetails: Array<{
      id: string;
      email: string;
      username: string;
    }> = [];
    try {
      internDetails = await db
        .selectFrom('user')
        .select(['id', 'email', 'username'])
        .where('role', '=', 'user')
        .execute();
      console.log(`📋 [ADMIN] Found ${internDetails.length} intern details`);
    } catch (internError) {
      console.error('❌ [ADMIN] Error fetching intern details:', internError);
      // Continue with empty intern details if the query fails
      internDetails = [];
    }

    const internMap = new Map<string, { email: string; username: string }>();
    internDetails.forEach((intern: any) => {
      internMap.set(intern.id, {
        email: intern.email,
        username: intern.username
      });
    });

    // Get pending proposals for these bills
    console.log('📋 [ADMIN] Fetching pending proposals...');
    let pendingProposals: Array<{
      bill_id: string;
      proposal_id: string;
      intern_id: string;
      current_status: string;
      suggested_status: string;
      proposed_at: Date | string;
      intern_email: string;
    }> = [];
    try {
      pendingProposals = await db
        .selectFrom('pending_proposals')
        .innerJoin('user as intern', 'pending_proposals.proposed_by_user_id', 'intern.id')
        .select([
          'pending_proposals.bill_id',
          'pending_proposals.id as proposal_id',
          'pending_proposals.proposed_by_user_id as intern_id',
          'pending_proposals.current_status',
          'pending_proposals.suggested_status',
          'pending_proposals.proposed_at',
          'intern.email as intern_email'
        ])
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
      console.log(`📋 [ADMIN] Found ${pendingProposals.length} pending proposals`);
    } catch (proposalError) {
      console.error('❌ [ADMIN] Error fetching pending proposals:', proposalError);
      // Continue without pending proposals if the query fails
      pendingProposals = [];
    }

    // Group bills by bill ID
    const billsMap = new Map<string, InternBill>();

    rawData.forEach((row: any) => {
      const billId = row.id;
      
      if (!billsMap.has(billId)) {
        // Create bill object
        const bill = mapBillsToBill(row as unknown as Bills);
        billsMap.set(billId, {
          bill,
          adopted_by: [],
          pending_proposals: []
        });
      }

      const internBill = billsMap.get(billId)!;
      const intern = internMap.get(row.intern_id);
      const supervisor = supervisorMap.get(row.intern_id);

      // Check if this intern is already in the adopted_by array (avoid duplicates)
      const alreadyAdded = internBill.adopted_by.some(
        (adopter) => adopter.intern_id === row.intern_id
      );

      if (!alreadyAdded) {
        // Add intern who adopted this bill
        internBill.adopted_by.push({
          intern_id: row.intern_id,
          intern_email: intern?.email || row.intern_id,
          intern_username: intern?.username || row.intern_id,
          supervisor_id: supervisor?.id || null,
          supervisor_email: supervisor?.email || null,
          supervisor_username: supervisor?.username || null,
          adopted_at: row.adopted_at
        });
      }
    });

    // Add pending proposals
    pendingProposals.forEach((proposal: any) => {
      const internBill = billsMap.get(proposal.bill_id);
      if (internBill) {
        internBill.pending_proposals.push({
          proposal_id: proposal.proposal_id,
          intern_id: proposal.intern_id,
          intern_email: proposal.intern_email,
          current_status: proposal.current_status,
          suggested_status: proposal.suggested_status,
          proposed_at: proposal.proposed_at
        });
      }
    });

    const internBills = Array.from(billsMap.values());

    console.log(`✅ [ADMIN] Returning ${internBills.length} bills adopted by interns`);
    return NextResponse.json({ success: true, bills: internBills });
  } catch (error) {
    console.error('❌ [ADMIN] Error loading intern bills:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ [ADMIN] Error details:', { errorMessage, errorStack });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load intern bills',
      details: errorMessage 
    }, { status: 500 });
  }
}
