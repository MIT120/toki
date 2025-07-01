import { NextRequest, NextResponse } from 'next/server';
import { getMeteringPointAction } from '../../../../src/services/metering-point-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Metering point ID is required' },
                { status: 400 }
            );
        }

        const result = await getMeteringPointAction(id);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.error?.includes('not found') ? 404 : 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Metering point API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 