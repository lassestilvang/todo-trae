import { NextRequest, NextResponse } from 'next/server';
import { getLabelById, updateLabel, deleteLabel } from '@/lib/api';
import { UpdateLabelSchema } from '@/lib/validations';
import { logLabelActivity, logLabelUpdate } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Label } from '@/types';
import { auth } from '@/lib/auth';

/**
 * @swagger
 * /api/labels/{id}:
 *   get:
 *     summary: Get a label by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Label object.
 *       404:
 *         description: Label not found.
 *   put:
 *     summary: Update a label
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
 *             $ref: '#/components/schemas/UpdateLabel'
 *     responses:
 *       200:
 *         description: Updated label object.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Label not found.
 *   delete:
 *     summary: Delete a label
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Label deleted.
 *       404:
 *         description: Label not found.
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
    const label = await getLabelById(id, session.user.id);
    if (!label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }
    return NextResponse.json(label);
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json({ error: 'Failed to fetch label' }, { status: 500 });
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
    const validatedData = UpdateLabelSchema.parse(body);
    
    const existingLabel = await getLabelById(id, session.user.id);
    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    const updatedLabel = await updateLabel(id, session.user.id, validatedData as Partial<Label>);
    
    // Log activity
    await logLabelUpdate(id, validatedData, existingLabel, session.user.id);
    
    return NextResponse.json(updatedLabel);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error updating label:', error);
    return NextResponse.json({ error: 'Failed to update label' }, { status: 500 });
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
    const existingLabel = await getLabelById(id, session.user.id);
    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    await deleteLabel(id, session.user.id);
    
    // Log activity
    await logLabelActivity(id, 'deleted', session.user.id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
