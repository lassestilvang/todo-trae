import { NextRequest, NextResponse } from 'next/server';
import { getAllLabels, createLabel } from '@/lib/api';
import { LabelSchema } from '@/lib/validations';
import { logLabelActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Label } from '@/types';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/labels:
 *   get:
 *     summary: Retrieve all labels
 *     responses:
 *       200:
 *         description: A list of labels.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Label'
 *   post:
 *     summary: Create a new label
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLabel'
 *     responses:
 *       201:
 *         description: Created label object.
 *       400:
 *         description: Validation error.
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labels = await getAllLabels(session.user.id);
    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = LabelSchema.parse(body);
    const label = await createLabel(validatedData as Omit<Label, 'createdAt' | 'updatedAt'>, session.user.id);
    
    // Log activity
    await logLabelActivity(label.id, 'created', session.user.id);
    
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}