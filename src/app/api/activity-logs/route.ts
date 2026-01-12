import { NextRequest, NextResponse } from 'next/server';
import { getAllActivityLogs, getActivityLogByTaskId } from '@/lib/api';

/**
 * @swagger
 * /api/activity-logs:
 *   get:
 *     summary: Retrieve activity logs
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of logs to skip
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         description: Filter logs by task ID
 *     responses:
 *       200:
 *         description: A list of activity logs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActivityLog'
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const taskId = searchParams.get('taskId');
    
    const logs = taskId 
      ? getActivityLogByTaskId(taskId, limit, offset)
      : getAllActivityLogs(limit, offset);
      
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
