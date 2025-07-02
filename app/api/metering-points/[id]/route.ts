import { NextRequest, NextResponse } from 'next/server';
import { getMeteringPointAction } from '../../../../src/services/metering-point-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: meteringPointId } = await params;

        if (!meteringPointId) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        const result = await getMeteringPointAction(meteringPointId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.error === 'Metering point not found' ? 404 : 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Metering point by ID API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 