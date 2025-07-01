"use server";

import {
    calculateCostAnalysis,
    getElectricityDataForDate,
    getElectricityDataForDateRange,
    validateMeteringPointAccess
} from '../../data';
import { CostAnalysis, ElectricityData } from '../types';

export async function getElectricityDataAction(
    meteringPointId: string,
    dateString: string
): Promise<{ success: boolean; data?: ElectricityData; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        if (!dateString) {
            return { success: false, error: 'Date is required' };
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const data = await getElectricityDataForDate(meteringPointId, date);

        if (!data) {
            return { success: false, error: 'No data found for the specified date' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error in getElectricityDataAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}

export async function getElectricityDataRangeAction(
    meteringPointId: string,
    startDateString: string,
    endDateString: string
): Promise<{ success: boolean; data?: ElectricityData[]; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        if (!startDateString || !endDateString) {
            return { success: false, error: 'Start date and end date are required' };
        }

        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        if (startDate > endDate) {
            return { success: false, error: 'Start date must be before end date' };
        }

        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            return { success: false, error: 'Date range cannot exceed 90 days' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const data = await getElectricityDataForDateRange(meteringPointId, startDate, endDate);

        return { success: true, data };
    } catch (error) {
        console.error('Error in getElectricityDataRangeAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}

export async function getCostAnalysisAction(
    meteringPointId: string,
    dateString: string
): Promise<{ success: boolean; data?: CostAnalysis; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        if (!dateString) {
            return { success: false, error: 'Date is required' };
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const analysis = await calculateCostAnalysis(meteringPointId, date);

        if (!analysis) {
            return { success: false, error: 'Unable to calculate cost analysis - insufficient data' };
        }

        return { success: true, data: analysis };
    } catch (error) {
        console.error('Error in getCostAnalysisAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
} 