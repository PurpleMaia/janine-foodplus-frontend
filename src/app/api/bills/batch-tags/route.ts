import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/kysely/client';

// POST - Get tags for multiple bills in a single request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billIds } = body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'billIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Fetch tags for all bills in a single query
    const billTags = await db
      .selectFrom('bill_tags as bt')
      .innerJoin('tags as t', 'bt.tag_id', 't.id')
      .select([
        'bt.bill_id',
        't.id',
        't.name',
        't.color',
        't.created_at',
        't.updated_at',
      ])
      .where('bt.bill_id', 'in', billIds)
      .orderBy('t.name', 'asc')
      .execute();

    // Group tags by bill ID
    const tagsByBillId = billTags.reduce((acc, row) => {
      if (!acc[row.bill_id]) {
        acc[row.bill_id] = [];
      }
      acc[row.bill_id].push({
        id: row.id,
        name: row.name,
        color: row.color,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      return acc;
    }, {} as Record<string, Array<{
      id: string;
      name: string;
      color: string | null;
      created_at: Date;
      updated_at: Date;
    }>>);

    // Ensure all requested bill IDs have an entry (even if empty)
    billIds.forEach(billId => {
      if (!tagsByBillId[billId]) {
        tagsByBillId[billId] = [];
      }
    });

    return NextResponse.json({ tags: tagsByBillId });
  } catch (error) {
    console.error('Error fetching batch bill tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch bill tags' },
      { status: 500 }
    );
  }
}
