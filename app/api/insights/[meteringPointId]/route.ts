import { NextRequest, NextResponse } from 'next/server';
import { getRealTimeInsightsAction } from '../../../../src/services/dashboard-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: { meteringPointId: string } }
) {
    try {
        const { meteringPointId } = params;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        const result = await getRealTimeInsightsAction(meteringPointId, date || undefined);

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
        console.error('Real-time insights API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 