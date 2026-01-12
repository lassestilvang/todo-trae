import { NextRequest, NextResponse } from 'next/server';
import { getAllLists, createList } from '@/lib/api';
import { TaskListSchema } from '@/lib/validations';
import { logListActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { TaskList } from '@/types';

/**
 * @swagger
 * /api/lists:
 *   get:
 *     summary: Retrieve all task lists
 *     responses:
 *       200:
 *         description: A list of task lists.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskList'
 *   post:
 *     summary: Create a new task list
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateList'
 *     responses:
 *       201:
 *         description: Created list object.
 *       400:
 *         description: Validation error.
 */

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
    const list = createList(validatedData as Omit<TaskList, 'createdAt' | 'updatedAt'>);
    
    // Log activity
    logListActivity(list.id, 'created');
    
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}