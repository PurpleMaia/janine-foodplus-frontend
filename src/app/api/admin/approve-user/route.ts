import { NextResponse, NextRequest } from "next/server";
import { getSessionCookie, validateSession } from "@/lib/auth";
import { userIdSchema } from "@/lib/validators";
import { approveUser } from "@/services/db/admins";
import { ApiError, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
    try {
        // Validate session
        const session_token = getSessionCookie(request);
        const user = await validateSession(session_token);        

        if (user.role !== 'admin') {
            console.error('[APPROVE USER] Unauthorized access attempt by user:', user.email, '(ADMIN ONLY)');
            throw Errors.UNAUTHORIZED;
        }

        // Parse and validate userIDtoApprove from request body
        const { userIDtoApprove } = await request.json();            

        const validation = userIdSchema.safeParse({ userId: userIDtoApprove });
        if (!validation.success) {
            console.error('[APPROVE USER] Failed to validate user ID to approve:', userIDtoApprove);
            throw Errors.INVALID_REQUEST;
        }

        // Approve the user
        console.log('📋 [APPROVE USER] Approving user with ID:', userIDtoApprove);
        await approveUser(userIDtoApprove);
        console.log('✅ [APPROVE USER] User approved successfully:', userIDtoApprove);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
            
        // Unknown error
        console.error('[ADMIN/APPROVE-USER] Unknown Error', error);
        return NextResponse.json(
            { error: 'Unknown Error' }, 
            { status: 500 }
        );
    }
}