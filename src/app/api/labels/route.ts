import { NextRequest, NextResponse } from 'next/server';
import { getAllLabels, createLabel } from '@/lib/api';
import { LabelSchema } from '@/lib/validations';
import { logLabelActivity } from '@/lib/activityLog';
import { ZodError } from 'zod';
import { Label } from '@/types';

export async function GET() {
  try {
    const labels = getAllLabels();
    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LabelSchema.parse(body);
    const label = createLabel(validatedData as Omit<Label, 'createdAt' | 'updatedAt'>);
    
    // Log activity
    logLabelActivity(label.id, 'created');
    
    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}