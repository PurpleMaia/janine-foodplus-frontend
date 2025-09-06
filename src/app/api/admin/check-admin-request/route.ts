import { checkAdminRequestStatus } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
    const { email } = await request.json();
    if (!email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const result = await checkAdminRequestStatus(email);
    if (!result) {
        return NextResponse.json({ error: 'Failed to check admin request status.' }, { status: 500 });
    }

    console.log(`Checked admin request status for email: ${email}, requested: ${result}`);

    return NextResponse.json({ success: true, adminRequested: result }, { status: 200 });
}
