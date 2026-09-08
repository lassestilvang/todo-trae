import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Retrieve all templates for the authenticated user
 *     tags:
 *       - Templates
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaskTemplate'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new task template
 *     tags:
 *       - Templates
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplate'
 *     responses:
 *       201:
 *         description: Template created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskTemplate'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).default('none'),
  estimate: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  listId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.userId, session.user.id))
      .orderBy(taskTemplates.createdAt);
    return NextResponse.json(templates);
  } catch (error) {
    logger.error('Failed to fetch templates', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, priority, estimate, listId } = parsed.data;
    const newTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      priority,
      estimate,
      listId,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(taskTemplates).values(newTemplate);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    logger.error('Failed to create template', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
