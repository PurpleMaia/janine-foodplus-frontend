import { NextResponse, NextRequest } from "next/server";
import { getSessionCookie, validateSession } from "@/lib/auth";
import { userIdSchema } from "@/lib/validators";
import { denyUser } from "@/services/db/admins";
import { ApiError, Errors } from "@/lib/errors";

export async function POST(request: NextRequest) {
    try {
        // Validate custom session
        const session_token = getSessionCookie(request);            
        const user = await validateSession(session_token);        
        if (user.role !== 'admin') {
            console.error('[DENY USER] Unauthorized access attempt by user:', user.email, '(ADMIN ONLY)');
            throw Errors.UNAUTHORIZED;
        }

        // Parse and validate userIDToDeny from request body
        const { userIDToDeny } = await request.json()        

        const validation = userIdSchema.safeParse({ userId: userIDToDeny });
        if (!validation.success) {
            console.error('[DENY USER] Failed to validate user ID to deny:', userIDToDeny);
            throw Errors.INVALID_REQUEST;
        }

        // Deny the user
        console.log('📋 [DENY USER] Denying user with ID:', userIDToDeny);

        await denyUser(userIDToDeny);

        console.log('✅ [DENY USER] User denied successfully:', userIDToDeny);
        return NextResponse.json({ success: true }, { status: 200 });            
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
            
        // Unknown error
        console.error('[ADMIN/DENY-USER] Unknown error:', error);
        return NextResponse.json(
            { error: 'Unknown Error' }, 
            { status: 500 }
        );
    }
}