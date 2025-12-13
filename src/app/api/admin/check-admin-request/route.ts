import { NextRequest, NextResponse } from "next/server";
import { emailSchema } from "@/lib/validators";
import { checkAdminRequestStatus } from "@/services/db/admins";
import { validateSession } from "@/lib/auth";
import { getSessionCookie } from "@/lib/edge-session";
import { ApiError } from "@/lib/errors";

// note: can move this into user context 
export async function POST(request: NextRequest) {
    try {
        // Validate session
        const sessionToken = getSessionCookie(request);    
        await validateSession(sessionToken);    

        // Parse and validate email from request body
        const { email } = await request.json();    

        const validation = emailSchema.safeParse(email);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        }
        console.log(`📋 [CHECK-ADMIN-REQUEST] Checking admin request status for email: ${email}`);

        // Check admin request status
        const result = await checkAdminRequestStatus(email);
        console.log(`✅ [CHECK-ADMIN-REQUEST] Admin request status for email: ${email}, requested: ${result}`);

        return NextResponse.json({ success: true, adminRequested: result }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
            
        // Unknown error
        console.error('[ADMIN/CHECK-ADMIN-REQUEST]', error);
        return NextResponse.json(
            { error: 'Unknown Error' }, 
            { status: 500 }
        );
    }
    
}
