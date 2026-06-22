import { NextResponse } from 'next/server';
import { db } from '@/db';
import { taskTemplates } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.userId, session.user.id));
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const newTemplate = {
      id: uuidv4(),
      ...body,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(taskTemplates).values(newTemplate);
    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
