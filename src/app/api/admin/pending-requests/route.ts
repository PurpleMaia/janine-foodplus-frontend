import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { getPendingRequests } from '@/lib/admin-utils';

export async function POST(request: NextRequest) { 
    try {
        //gets session token from cookie 
        const session_token = getSessionCookie(request);
        console.log('Session token from cookie:', session_token);
        
        //if there is no cookie, user is not logged in
        if (!session_token) {
            return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
        }
    
        //validates session in the databse 
        const user = await validateSession(session_token);
        console.log('Validated user from session token:', user);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
        } else if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin Access only' }, { status: 402 });
        }

        const result = await getPendingRequests(user.id);
        return NextResponse.json({ success: true, pendingAccountRequests: result }, { status: 200 });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch pending requests' }, { status: 500 });
    }
}