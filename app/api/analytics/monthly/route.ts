import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummaryAction } from '../../../../src/services/analytics-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const meteringPointId = searchParams.get('meteringPointId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        if (!month || !year) {
            return NextResponse.json(
                { error: 'Month and year parameters are required' },
                { status: 400 }
            );
        }

        const result = await getMonthlySummaryAction(meteringPointId, parseInt(month), parseInt(year));

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
        console.error('Monthly analytics API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 