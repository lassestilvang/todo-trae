import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAnalyticsData } from '@/lib/analytics';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Retrieve productivity analytics
 *     description: Returns aggregated data for productivity trends, completion rates, and time allocation.
 *     responses:
 *       200:
 *         description: Analytics data object.
 *       401:
 *         description: Unauthorized.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getAnalyticsData(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching analytics data', { error });
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
