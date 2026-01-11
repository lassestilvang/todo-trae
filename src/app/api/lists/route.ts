import { NextRequest, NextResponse } from 'next/server';
import { getAllLists, createList } from '@/lib/api';
import { TaskListSchema } from '@/lib/validations';
import { logListActivity } from '@/lib/activityLog';

export async function GET() {
  try {
    const lists = getAllLists();
    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TaskListSchema.parse(body);
    const list = createList(validatedData as any);
    
    // Log activity
    logListActivity(list.id, 'created');
    
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}