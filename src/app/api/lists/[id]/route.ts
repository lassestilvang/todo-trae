import { NextRequest, NextResponse } from 'next/server';
import { getListById, updateList, deleteList } from '@/lib/api';
import { UpdateTaskListSchema } from '@/lib/validations';
import { logListActivity, logListUpdate } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { TaskList } from '@/types';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Get a list by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List object.
 *       404:
 *         description: List not found.
 *   put:
 *     summary: Update a list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateList'
 *     responses:
 *       200:
 *         description: Updated list object.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: List not found.
 *   delete:
 *     summary: Delete a list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: List deleted.
 *       404:
 *         description: List not found.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const list = await getListById(id, session.user.id);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateTaskListSchema.parse(body);
    
    const existingList = await getListById(id, session.user.id);
    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const updatedList = await updateList(id, session.user.id, validatedData as Partial<TaskList>);
    
    // Log activity
    await logListUpdate(id, validatedData, existingList, session.user.id);
    
    return NextResponse.json(updatedList);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingList = await getListById(id, session.user.id);
    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    await deleteList(id, session.user.id);
    
    // Log activity
    await logListActivity(id, 'deleted', session.user.id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
