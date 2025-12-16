import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/kysely/client';
import { validateSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/cookies';
import { newTagSchema } from '@/lib/validators';

// GET - Fetch all tags (public access for filtering)
export async function GET(request: NextRequest) {
  try {
    // Allow public access to tags for filtering purposes
    // Try to fetch tags, return empty array if table doesn't exist yet
    try {
      const tags = await db
        .selectFrom('tags')
        .selectAll()
        .orderBy('name', 'asc')
        .execute();

      return NextResponse.json({ tags });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of error
      if (dbError?.message?.includes('does not exist') || dbError?.code === '42P01') {
        console.log('Tags table does not exist yet, returning empty array');
        return NextResponse.json({ tags: [] });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json({ tags: [] });
  }
}

// POST - Create a new tag (admin and supervisor only)
export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      console.log('Session validation failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and supervisor can create tags
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and supervisors can create tags' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color } = body;

    const validation = newTagSchema.safeParse({ name, color });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if tag with same name already exists
    const existingTag = await db
      .selectFrom('tags')
      .select('id')
      .where('name', '=', name.trim())
      .executeTakeFirst();

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    const newTag = await db
      .insertInto('tags')
      .values({
        name: name.trim(),
        color: color || null,
      })
      .returningAll()
      .executeTakeFirst();

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

