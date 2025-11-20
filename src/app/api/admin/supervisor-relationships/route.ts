import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../../db/kysely/client';

interface SupervisorRelationship {
  supervisor_id: string;
  supervisor_email: string;
  supervisor_username: string;
  interns: Array<{
    id: string;
    email: string;
    username: string;
    adopted_at: string;
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

    console.log('📋 [ADMIN] Loading supervisor-intern relationships...');

    // Get all supervisors
    console.log('📋 [ADMIN] Fetching supervisors...');
    let supervisors: Array<{
      id: string;
      email: string;
      username: string;
    }> = [];
    try {
      supervisors = await db
        .selectFrom('user')
        .select(['id', 'email', 'username'])
        .where('role', '=', 'supervisor')
        .where('account_status', '=', 'active')
        .execute();
      console.log(`📋 [ADMIN] Found ${supervisors.length} supervisors`);
    } catch (supervisorError) {
      console.error('❌ [ADMIN] Error fetching supervisors:', supervisorError);
      throw supervisorError;
    }

    // Get all supervisor-intern relationships
    console.log('📋 [ADMIN] Fetching supervisor-intern relationships...');
    let relationships: Array<{
      supervisor_id: string;
      intern_id: string;
      adopted_at: Date | string;
      intern_email: string;
      intern_username: string;
    }> = [];
    try {
      relationships = await db
        .selectFrom('supervisor_users')
        .innerJoin('user as intern', 'supervisor_users.user_id', 'intern.id')
        .select([
          'supervisor_users.supervisor_id',
          'supervisor_users.user_id as intern_id',
          'supervisor_users.created_at as adopted_at',
          'intern.email as intern_email',
          'intern.username as intern_username'
        ])
        .execute();
      console.log(`📋 [ADMIN] Found ${relationships.length} relationships`);
    } catch (relationshipError) {
      console.error('❌ [ADMIN] Error fetching relationships:', relationshipError);
      // Continue with empty relationships if the join fails
      relationships = [];
    }

    // Group interns by supervisor
    const internsBySupervisor = new Map<string, Array<{
      id: string;
      email: string;
      username: string;
      adopted_at: string;
    }>>();

    relationships.forEach((rel: any) => {
      if (!internsBySupervisor.has(rel.supervisor_id)) {
        internsBySupervisor.set(rel.supervisor_id, []);
      }
      internsBySupervisor.get(rel.supervisor_id)!.push({
        id: rel.intern_id,
        email: rel.intern_email,
        username: rel.intern_username,
        adopted_at: rel.adopted_at
      });
    });

    // Combine all data
    const supervisorRelationships: SupervisorRelationship[] = supervisors.map((supervisor: any) => ({
      supervisor_id: supervisor.id,
      supervisor_email: supervisor.email,
      supervisor_username: supervisor.username,
      interns: internsBySupervisor.get(supervisor.id) || []
    }));

    console.log(`✅ [ADMIN] Returning ${supervisorRelationships.length} supervisor relationships`);
    return NextResponse.json({ success: true, relationships: supervisorRelationships });
  } catch (error) {
    console.error('❌ [ADMIN] Error loading supervisor relationships:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ [ADMIN] Error details:', { errorMessage, errorStack });
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load supervisor relationships',
      details: errorMessage 
    }, { status: 500 });
  }
}

