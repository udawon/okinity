import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { consultations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

function checkAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.ADMIN_SECRET;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = await getDb()
    .select()
    .from(consultations)
    .orderBy(desc(consultations.createdAt));

  return NextResponse.json(all);
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  const [updated] = await getDb()
    .update(consultations)
    .set({ status })
    .where(eq(consultations.id, id))
    .returning();

  return NextResponse.json(updated);
}
