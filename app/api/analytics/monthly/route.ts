import { NextRequest, NextResponse } from 'next/server';
import { getMonthlySummaryAction } from '../../../../src/services/analytics-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const meteringPointId = searchParams.get('meteringPointId');
        const monthStr = searchParams.get('month');
        const yearStr = searchParams.get('year');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        if (!monthStr || !yearStr) {
            return NextResponse.json(
                { error: 'Month and year parameters are required' },
                { status: 400 }
            );
        }

        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);

        if (isNaN(month) || isNaN(year)) {
            return NextResponse.json(
                { error: 'Month and year must be valid numbers' },
                { status: 400 }
            );
        }

        const result = await getMonthlySummaryAction(meteringPointId, month, year);

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