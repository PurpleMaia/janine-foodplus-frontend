import { NextResponse, NextRequest } from "next/server";
import { getSessionCookie, validateSession } from "@/lib/auth";
import { userIdSchema } from "@/lib/validators";
import { approveUser } from "@/services/db/admins";

export async function POST(request: NextRequest) {
    try {
        // Validate session
        const session_token = getSessionCookie(request);
        console.log('Checking session token from cookie:', session_token);
    
        if (!session_token) {
            return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
        }

        const user = await validateSession(session_token);
        console.log('Validated user from session token:', user);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
        } else if (user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin Access only' }, { status: 403 });
        }

        // Parse and validate userIDtoApprove from request body
        const { userIDtoApprove } = await request.json();
        
        if (!userIDtoApprove) {
            return NextResponse.json({ success: false, error: 'User ID to approve is required' }, { status: 400 });
        }

        const validation = userIdSchema.safeParse({ userId: userIDtoApprove });
        if (!validation.success) {
            return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
        }

        // Approve the user
        console.log('Approving user with ID:', userIDtoApprove);
        const result = await approveUser(userIDtoApprove);
        
        if (result) {
            return NextResponse.json({ success: true }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: 'User approval failed or user not found' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error approving user:', error);
        return NextResponse.json({ success: false, error: 'Failed to approve user' }, { status: 500 });
    }
}