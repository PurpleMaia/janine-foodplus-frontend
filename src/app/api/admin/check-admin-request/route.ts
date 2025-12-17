import { checkAdminRequestStatus } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";
import { emailSchema } from "@/lib/validators";
export async function POST(request: NextRequest) {
    const { email } = await request.json();
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
