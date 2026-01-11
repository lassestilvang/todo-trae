import { NextRequest, NextResponse } from 'next/server';
import { getListById, updateList, deleteList } from '@/lib/api';
import { UpdateTaskListSchema } from '@/lib/validations';
import { logListActivity, logListUpdate } from '@/lib/activityLog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = getListById(id);
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateTaskListSchema.parse(body);
    
    const existingList = getListById(id);
    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const updatedList = updateList(id, validatedData as any);
    
    // Log activity
    logListUpdate(id, validatedData as any, existingList);
    
    return NextResponse.json(updatedList);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (error as any).errors }, { status: 400 });
    }
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingList = getListById(id);
    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    deleteList(id);
    
    // Log activity
    logListActivity(id, 'deleted');
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
