import { NextRequest, NextResponse } from 'next/server';
import { getCostAnalysisAction } from '../../../../../src/services/electricity-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meteringPointId: string }> }
) {
    try {
        const { meteringPointId } = await params;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        const result = await getCostAnalysisAction(meteringPointId, date);

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
        console.error('Cost analysis API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 