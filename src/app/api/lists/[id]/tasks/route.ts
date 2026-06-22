import { NextRequest, NextResponse } from 'next/server';
import { getTasksByListId, getListById } from '@/lib/api';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/lists/{id}/tasks:
 *   get:
 *     summary: Retrieve tasks for a specific list
 *     description: Returns tasks associated with the given list ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the list
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of tasks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of tasks to skip
 *     responses:
 *       200:
 *         description: A list of tasks.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: List not found.
 *       500:
 *         description: Server error.
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
    
    // Verify list exists and belongs to user
    const list = await getListById(id, session.user.id);
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const tasks = await getTasksByListId(id, session.user.id, limit, offset);
    return NextResponse.json(tasks);
  } catch (error) {
    logger.error('Error fetching tasks for list', { error, listId: (await params).id });
    return NextResponse.json({ error: 'Failed to fetch tasks for list' }, { status: 500 });
  }
}
