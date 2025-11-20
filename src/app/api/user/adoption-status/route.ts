import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { isUserAdopted } from '@/services/users';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Only check adoption status for interns (users with role 'user')
    if (user.role !== 'user') {
      // Supervisors and admins don't need adoption status
      return NextResponse.json({ 
        success: true, 
        isAdopted: true // They have full permissions
      });
    }

    const adopted = await isUserAdopted(user.id);
    return NextResponse.json({ 
      success: true, 
      isAdopted: adopted 
    });
  } catch (error) {
    console.error('Error checking adoption status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check adoption status' },
      { status: 500 }
    );
  }
}

