import { denyUser } from "@/lib/admin-utils";
import { getSessionCookie, validateSession } from "@/lib/simple-auth";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userIDToDeny } = await request.json()

        if (!userIDToDeny) {
            return NextResponse.json({ success: false, error: 'User ID to deny is required' }, { status: 400 });            
        }

        //gets session token from cookie 
        const session_token = getSessionCookie(request);
        console.log('Checking session token from cookie:', session_token);
    
        //if there is no cookie, user is not logged in
        if (!session_token) {
            return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
        }
    
        //validates session in the databse 
        const user = await validateSession(session_token);
        console.log('Validated user from session token:', user);

        if (!user) {
            return { error: 'Not authorized' };
        } else if (user.role !== 'admin') {
            return { error: 'Unauthorized: Admin Access only' };
        }

        console.log('Approving user with ID:', userIDToDeny);
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