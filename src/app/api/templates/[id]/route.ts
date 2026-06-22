import { NextResponse } from 'next/server';
import { db } from '@/db';
import { taskTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await db
      .delete(taskTemplates)
      .where(and(eq(taskTemplates.id, id), eq(taskTemplates.userId, session.user.id)));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
