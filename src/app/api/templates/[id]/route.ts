import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Retrieve a single template by ID
 *     tags:
 *       - Templates
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskTemplate'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *   put:
 *     summary: Update a template
 *     tags:
 *       - Templates
 *     security:
 *       - BearerAuth: []
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
 *             $ref: '#/components/schemas/UpdateTemplate'
 *     responses:
 *       200:
 *         description: Updated template
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskTemplate'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *   delete:
 *     summary: Delete a template
 *     tags:
 *       - Templates
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 *       401:
 *         description: Unauthorized
 */

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']).optional(),
  estimate: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  listId: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const [template] = await db
      .select()
      .from(taskTemplates)
      .where(and(eq(taskTemplates.id, id), eq(taskTemplates.userId, session.user.id)))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    logger.error('Failed to fetch template', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    await db
      .update(taskTemplates)
      .set(updates)
      .where(and(eq(taskTemplates.id, id), eq(taskTemplates.userId, session.user.id)));

    const [updated] = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.id, id))
      .limit(1);

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Failed to update template', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    await db
      .delete(taskTemplates)
      .where(and(eq(taskTemplates.id, id), eq(taskTemplates.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete template', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
