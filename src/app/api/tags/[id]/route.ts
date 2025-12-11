import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db/kysely/client';
import { validateSession, getSessionCookie } from '@/lib/simple-auth';

// PUT - Update a tag (admin and supervisor only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and supervisor can update tags
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and supervisors can update tags' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color } = body;
    const { id: tagId } = await params;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if tag exists
    const existingTag = await db
      .selectFrom('tags')
      .select('id')
      .where('id', '=', tagId)
      .executeTakeFirst();

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if another tag with same name exists
    const duplicateTag = await db
      .selectFrom('tags')
      .select('id')
      .where('name', '=', name.trim())
      .where('id', '!=', tagId)
      .executeTakeFirst();

    if (duplicateTag) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }

    const updatedTag = await db
      .updateTable('tags')
      .set({
        name: name.trim(),
        color: color || null,
        updated_at: new Date(),
      })
      .where('id', '=', tagId)
      .returningAll()
      .executeTakeFirst();

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tag (admin and supervisor only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and supervisor can delete tags
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and supervisors can delete tags' },
        { status: 403 }
      );
    }

    const { id: tagId } = await params;

    // Check if tag exists
    const existingTag = await db
      .selectFrom('tags')
      .select('id')
      .where('id', '=', tagId)
      .executeTakeFirst();

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Delete tag (cascade will remove bill_tags associations)
    await db.deleteFrom('tags').where('id', '=', tagId).execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}

