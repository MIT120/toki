"use server";

import {
    getCustomerData,
    getMeteringPointById,
    getMeteringPoints,
    validateMeteringPointAccess
} from '../../data';
import { Customer, MeteringPoint } from '../types';

export async function getMeteringPointsAction(): Promise<{
    success: boolean;
    data?: MeteringPoint[];
    error?: string
}> {
    try {
        const meteringPoints = await getMeteringPoints();
        return { success: true, data: meteringPoints };
    } catch (error) {
        console.error('Error in getMeteringPointsAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch metering points'
        };
    }
}

export async function getMeteringPointAction(
    meteringPointId: string
): Promise<{ success: boolean; data?: MeteringPoint; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const meteringPoint = await getMeteringPointById(meteringPointId);

        if (!meteringPoint) {
            return { success: false, error: 'Metering point not found' };
        }

        return { success: true, data: meteringPoint };
    } catch (error) {
        console.error('Error in getMeteringPointAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch metering point'
        };
    }
}

export async function getCustomerDataAction(): Promise<{
    success: boolean;
    data?: Customer;
    error?: string
}> {
    try {
        const customer = await getCustomerData();
        return { success: true, data: customer };
    } catch (error) {
        console.error('Error in getCustomerDataAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch customer data'
        };
    }
}

export async function validateAccessAction(
    meteringPointId: string
): Promise<{ success: boolean; hasAccess?: boolean; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        return { success: true, hasAccess };
    } catch (error) {
        console.error('Error in validateAccessAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate access'
        };
    }
} 