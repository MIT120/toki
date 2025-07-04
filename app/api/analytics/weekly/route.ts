import { NextRequest, NextResponse } from 'next/server';
import { getWeeklySummaryAction } from '../../../../src/services/analytics-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const meteringPointId = searchParams.get('meteringPointId');
        const weekStartDate = searchParams.get('weekStartDate');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        if (!weekStartDate) {
            return NextResponse.json(
                { error: 'Week start date parameter is required' },
                { status: 400 }
            );
        }

        const result = await getWeeklySummaryAction(meteringPointId, weekStartDate);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Weekly analytics API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 