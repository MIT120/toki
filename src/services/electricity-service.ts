"use server";

import {
    calculateCostAnalysis,
    getElectricityDataForDate,
    getElectricityDataForDateRange,
    validateMeteringPointAccess
} from '../../data';
import { CostAnalysis, ElectricityData } from '../types';
import { ErrorCodes, createAppError } from '../utils/error-logger';
import {
    executeWithErrorHandling,
    validateDate,
    validateDateRange,
    validateMeteringPointId,
    withPerformanceTracking,
    type ServiceResponse
} from '../utils/service-helpers';

export async function getElectricityDataAction(
    meteringPointId: string,
    dateString: string
): Promise<ServiceResponse<ElectricityData>> {
    return executeWithErrorHandling(
        async () => {
            const context = {
                component: 'ElectricityService',
                action: 'getElectricityData',
                meteringPointId,
                additionalData: { date: dateString }
            };

            const validatedMeteringPointId = validateMeteringPointId(meteringPointId, context);
            const validatedDate = validateDate(dateString, 'Date', context);

            const hasAccess = await validateMeteringPointAccess(validatedMeteringPointId);
            if (!hasAccess) {
                throw createAppError(
                    'Access denied for this metering point',
                    ErrorCodes.FORBIDDEN,
                    403,
                    context
                );
            }

            const data = await withPerformanceTracking(
                () => getElectricityDataForDate(validatedMeteringPointId, validatedDate),
                'getElectricityDataForDate',
                context
            );

            if (!data) {
                throw createAppError(
                    'No data found for the specified date',
                    ErrorCodes.RESOURCE_NOT_FOUND,
                    404,
                    context
                );
            }

            return data;
        },
        'getElectricityData',
        {
            context: {
                component: 'ElectricityService',
                meteringPointId,
                additionalData: { date: dateString }
            },
            retries: 2
        }
    );
}

export async function getElectricityDataRangeAction(
    meteringPointId: string,
    startDateString: string,
    endDateString: string
): Promise<ServiceResponse<ElectricityData[]>> {
    return executeWithErrorHandling(
        async () => {
            const context = {
                component: 'ElectricityService',
                action: 'getElectricityDataRange',
                meteringPointId,
                additionalData: {
                    startDate: startDateString,
                    endDate: endDateString
                }
            };

            const validatedMeteringPointId = validateMeteringPointId(meteringPointId, context);
            const { startDate, endDate } = validateDateRange(
                startDateString,
                endDateString,
                90,
                context
            );

            const hasAccess = await validateMeteringPointAccess(validatedMeteringPointId);
            if (!hasAccess) {
                throw createAppError(
                    'Access denied for this metering point',
                    ErrorCodes.FORBIDDEN,
                    403,
                    context
                );
            }

            const data = await withPerformanceTracking(
                () => getElectricityDataForDateRange(validatedMeteringPointId, startDate, endDate),
                'getElectricityDataForDateRange',
                context
            );

            return data;
        },
        'getElectricityDataRange',
        {
            context: {
                component: 'ElectricityService',
                meteringPointId,
                additionalData: {
                    startDate: startDateString,
                    endDate: endDateString
                }
            },
            retries: 2
        }
    );
}

export async function getCostAnalysisAction(
    meteringPointId: string,
    dateString: string
): Promise<ServiceResponse<CostAnalysis>> {
    return executeWithErrorHandling(
        async () => {
            const context = {
                component: 'ElectricityService',
                action: 'getCostAnalysis',
                meteringPointId,
                additionalData: { date: dateString }
            };

            const validatedMeteringPointId = validateMeteringPointId(meteringPointId, context);
            const validatedDate = validateDate(dateString, 'Date', context);

            const hasAccess = await validateMeteringPointAccess(validatedMeteringPointId);
            if (!hasAccess) {
                throw createAppError(
                    'Access denied for this metering point',
                    ErrorCodes.FORBIDDEN,
                    403,
                    context
                );
            }

            const analysis = await withPerformanceTracking(
                () => calculateCostAnalysis(validatedMeteringPointId, validatedDate),
                'calculateCostAnalysis',
                context
            );

            if (!analysis) {
                throw createAppError(
                    'Unable to calculate cost analysis - insufficient data',
                    ErrorCodes.INSUFFICIENT_DATA,
                    404,
                    context
                );
            }

            return analysis;
        },
        'getCostAnalysis',
        {
            context: {
                component: 'ElectricityService',
                meteringPointId,
                additionalData: { date: dateString }
            },
            retries: 1
        }
    );
} 