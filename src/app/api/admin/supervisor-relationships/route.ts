import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '../../../../db/kysely/client';
import { ApiError, Errors } from '@/lib/errors';

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
    const user = await validateSession(session_token);
    if (!user || user.role !== 'admin') {
      console.error('[ADMIN] Unauthorized access attempt by user:', user?.email || 'unknown', '(ADMIN ONLY)');
      return Errors.UNAUTHORIZED;
    }

    console.log('📋 [SUPERVISOR RELATIONS] Loading supervisor-intern relationships...');

    // Get all supervisors
    console.log('📋 [SUPERVISOR RELATIONS] Fetching supervisors...');
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
      console.log(`📋 [SUPERVISOR RELATIONS] Found ${supervisors.length} supervisors`);
    } catch (supervisorError) {
      console.error('❌ [SUPERVISOR RELATIONS] Error fetching supervisors:', supervisorError);
      throw supervisorError;
    }

    // Get all supervisor-intern relationships
    console.log('📋 [SUPERVISOR RELATIONS] Fetching supervisor-intern relationships...');
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
      console.log(`📋 [SUPERVISOR RELATIONS] Found ${relationships.length} relationships`);
    } catch (relationshipError) {
      console.error('❌ [SUPERVISOR RELATIONS] Error fetching relationships:', relationshipError);
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

    console.log(`✅ [SUPERVISOR RELATIONS] Returning ${supervisorRelationships.length} supervisor relationships`);
    return NextResponse.json({ success: true, relationships: supervisorRelationships });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[ADMIN/SUPERVISOR-RELATIONSHIP]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}