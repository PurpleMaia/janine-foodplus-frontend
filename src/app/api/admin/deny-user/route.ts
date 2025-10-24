import { denyUser } from "@/lib/admin-utils";
import { getSessionCookie, validateSession } from "@/lib/simple-auth";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { userIDToDeny } = await request.json()

        if (!userIDToDeny) {
            return NextResponse.json({ success: false, error: 'User ID to deny is required' }, { status: 400 });            
        }

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
            console.log('Checking session token from cookie:', session_token);
        
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

        console.log('Denying user with ID:', userIDToDeny);
        const result = await denyUser(userIDToDeny);
        
        if (result) {
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: 'User denial failed or user not found' }, { status: 402 });
        }
    } catch (error) {
        console.error('Error denying user:', error);
        return NextResponse.json({ success: false, error: 'Failed to deny user' }, { status: 500 });
    }
}