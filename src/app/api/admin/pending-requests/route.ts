import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { getPendingRequests } from '@/lib/admin-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) { 
    try {
        // Try NextAuth session first (for Google users)
        const nextAuthSession = await getServerSession(authOptions);
        
        let user = null;
        
        if (nextAuthSession?.user) {
            // User is authenticated via NextAuth
            user = {
                id: nextAuthSession.user.id,
                email: nextAuthSession.user.email,
                role: nextAuthSession.user.role,
                username: nextAuthSession.user.name || ''
            };
        } else {
            // Try custom session validation (for local users)
            const session_token = getSessionCookie(request);
            console.log('Session token from cookie:', session_token);
            
            if (!session_token) {
                return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
            }
            
            user = await validateSession(session_token);
            console.log('Validated user from session token:', user);
        }

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