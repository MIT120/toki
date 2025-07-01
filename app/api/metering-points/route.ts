import { NextResponse } from 'next/server';
import { getCustomerDataAction, getMeteringPointsAction } from '../../../src/services/metering-point-service';

export async function GET() {
    try {
        const [meteringPointsResult, customerResult] = await Promise.all([
            getMeteringPointsAction(),
            getCustomerDataAction()
        ]);

        if (!meteringPointsResult.success) {
            return NextResponse.json(
                { error: meteringPointsResult.error },
                { status: 400 }
            );
        }

        if (!customerResult.success) {
            return NextResponse.json(
                { error: customerResult.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                customer: customerResult.data,
                meteringPoints: meteringPointsResult.data
            }
        });
    } catch (error) {
        console.error('Metering points API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 