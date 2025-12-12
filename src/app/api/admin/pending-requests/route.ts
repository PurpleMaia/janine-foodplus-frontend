import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { getPendingRequests } from "@/services/db/admins";

export async function POST(request: NextRequest) { 
    try {
        // Validate custom session
        const session_token = getSessionCookie(request);
        
        if (!session_token) {
            return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
        }
        
        const user = await validateSession(session_token);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
        } else if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin Access only' }, { status: 403 });
        }

        const result = await getPendingRequests(user.id);
        return NextResponse.json({ success: true, pendingAccountRequests: result }, { status: 200 });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch pending requests' }, { status: 500 });
    }
}