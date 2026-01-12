import { NextRequest, NextResponse } from 'next/server';
import { getLabelById, updateLabel, deleteLabel } from '@/lib/api';
import { UpdateLabelSchema } from '@/lib/validations';
import { logLabelActivity, logLabelUpdate } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Label } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const label = getLabelById(id);
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
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateLabelSchema.parse(body);
    
    const existingLabel = getLabelById(id);
    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    const updatedLabel = updateLabel(id, validatedData as Partial<Label>);
    
    // Log activity
    logLabelUpdate(id, validatedData, existingLabel);
    
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
    const { id } = await params;
    const existingLabel = getLabelById(id);
    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    deleteLabel(id);
    
    // Log activity
    logLabelActivity(id, 'deleted');
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
