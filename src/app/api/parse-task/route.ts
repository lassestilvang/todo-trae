import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getAllLabels } from '@/lib/api';
import { parseNaturalLanguage } from '@/lib/ai';
import { z } from 'zod';

const ParseTaskSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

/**
 * @swagger
 * /api/parse-task:
 *   post:
 *     summary: Parse natural language into structured task fields
 *     tags:
 *       - AI
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Natural language task input
 *                 example: "Buy milk #shopping tomorrow at 3pm urgent"
 *     responses:
 *       200:
 *         description: Parsed task fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 deadline:
 *                   type: string
 *                   format: date-time
 *                 estimate:
 *                   type: string
 *                 priority:
 *                   type: string
 *                   enum: [high, medium, low, none]
 *                 labelIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized.
 *       400:
 *         description: Validation error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ParseTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text } = parsed.data;
    const labels = await getAllLabels(session.user.id);

    const result = parseNaturalLanguage(text, {
      availableLabels: labels.map(l => ({ id: l.id, name: l.name })),
      defaultPriority: 'none',
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error parsing natural language', { error });
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 });
  }
}
