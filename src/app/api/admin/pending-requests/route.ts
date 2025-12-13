import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { getPendingRequests } from "@/services/db/admins";
import { ApiError, Errors } from '@/lib/errors';

export async function GET(request: NextRequest) { 
    try {
        // Validate session   
        const token = getSessionCookie(request);
        const user = await validateSession(token);

        // Check if user is admin
        if (user.role !== 'admin') {
            console.log('[PENDING REQUESTS] Unauthorized access attempt by user:', user.username, '(ADMIN ONLY)');
            throw Errors.UNAUTHORIZED;
        }

        // Get pending requests
        const result = await getPendingRequests(user.id);
        return NextResponse.json({ success: true, pendingAccountRequests: result }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
              return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
              );
            }
        
        // Unknown error
        console.error('[ADMIN/PENDING-REQUESTS]', error);
        return NextResponse.json(
            { error: 'Unknown Error' }, 
            { status: 500 }
        );
    }
}