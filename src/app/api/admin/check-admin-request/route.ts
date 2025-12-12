import { NextRequest, NextResponse } from "next/server";
import { emailSchema } from "@/lib/validators";
import { checkAdminRequestStatus } from "@/services/db/admins";
import { getSessionCookie, validateSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
    // Validate session
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate email from request body
    const { email } = await request.json();
    if (!email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }



    // Check admin request status
    const result = await checkAdminRequestStatus(email);
    if (result === null) {
        return NextResponse.json({ error: 'Failed to check admin request status.' }, { status: 500 });
    }

    console.log(`Checked admin request status for email: ${email}, requested: ${result}`);

    return NextResponse.json({ success: true, adminRequested: result }, { status: 200 });
}
