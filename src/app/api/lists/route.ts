import { NextRequest, NextResponse } from 'next/server';
import { getAllLists, createList } from '@/lib/api';

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
    const list = createList(body);
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}