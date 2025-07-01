import { NextRequest, NextResponse } from 'next/server';
import { getElectricityDataAction, getElectricityDataRangeAction } from '../../../../src/services/electricity-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: { meteringPointId: string } }
) {
    try {
        const { meteringPointId } = await params;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        let result;
        if (startDate && endDate) {
            result = await getElectricityDataRangeAction(meteringPointId, startDate, endDate);
        } else if (date) {
            result = await getElectricityDataAction(meteringPointId, date);
        } else {
            return NextResponse.json(
                { error: 'Either date or startDate/endDate parameters are required' },
                { status: 400 }
            );
        }

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
        console.error('Electricity data API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 