import { checkAdminRequestStatus } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";
import { emailSchema } from "@/lib/validators";
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    // Require authentication - users can only check their own status
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    // Verify the email matches the authenticated user
    if (email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await checkAdminRequestStatus(email);
    if (result === null) {
        return NextResponse.json({ error: 'Failed to check admin request status.' }, { status: 500 });
    }

    console.log(`Checked admin request status for email: ${email}, requested: ${result}`);

    return NextResponse.json({ success: true, adminRequested: result }, { status: 200 });
}
