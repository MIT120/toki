import { ServiceResponse } from '../types';
import { addSentryBreadcrumb, createAppError, ErrorCodes, logError, type ErrorCode, type ErrorContext } from './error-logger';

export type { ServiceResponse };

export interface ServiceOptions {
    context?: ErrorContext;
    retries?: number;
    timeout?: number;
    validateInput?: boolean;
}

export class ServiceError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly statusCode: number = 500,
        public readonly context?: ErrorContext
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

export async function executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: ServiceOptions = {}
): Promise<ServiceResponse<T>> {
    const { context = {}, retries = 0, timeout } = options;

    addSentryBreadcrumb(`Starting ${operationName}`, 'service', 'info');

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
        try {
            const startTime = Date.now();

            let result: T;
            if (timeout) {
                result = await Promise.race([
                    operation(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Operation timeout')), timeout)
                    ),
                ]);
            } else {
                result = await operation();
            }

            const duration = Date.now() - startTime;
            addSentryBreadcrumb(
                `${operationName} completed successfully in ${duration}ms`,
                'service',
                'info'
            );

            return { success: true, data: result };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            attempt++;

            const errorContext: ErrorContext = {
                ...context,
                action: operationName,
                additionalData: {
                    attempt,
                    maxRetries: retries,
                    ...context.additionalData,
                },
            };

            if (attempt <= retries) {
                logError(lastError, {
                    level: 'warning',
                    context: errorContext,
                    tags: {
                        retry_attempt: attempt.toString(),
                        operation: operationName,
                    },
                });

                addSentryBreadcrumb(
                    `${operationName} failed, retrying (${attempt}/${retries})`,
                    'service',
                    'warning'
                );

                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
            } else {
                logError(lastError, {
                    level: 'error',
                    context: errorContext,
                    tags: {
                        final_attempt: 'true',
                        operation: operationName,
                    },
                });

                addSentryBreadcrumb(`${operationName} failed after ${retries + 1} attempts`, 'service', 'error');
            }
        }
    }

    if (lastError instanceof ServiceError) {
        return {
            success: false,
            error: lastError.message,
            errorCode: lastError.code,
        };
    }

    const errorCode = getErrorCodeFromError(lastError!);
    return {
        success: false,
        error: lastError!.message,
        errorCode,
    };
}

export function validateRequired<T>(
    value: T,
    fieldName: string,
    context?: ErrorContext
): T {
    if (value === null || value === undefined || value === '') {
        throw createAppError(
            `${fieldName} is required`,
            ErrorCodes.MISSING_REQUIRED_FIELD,
            400,
            context
        );
    }
    return value;
}

export function validateMeteringPointId(
    meteringPointId: string,
    context?: ErrorContext
): string {
    validateRequired(meteringPointId, 'Metering point ID', context);

    if (typeof meteringPointId !== 'string' || meteringPointId.trim().length === 0) {
        throw createAppError(
            'Invalid metering point ID format',
            ErrorCodes.INVALID_INPUT,
            400,
            context
        );
    }

    return meteringPointId.trim();
}

export function validateDate(
    dateString: string,
    fieldName: string = 'Date',
    context?: ErrorContext
): Date {
    validateRequired(dateString, fieldName, context);

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw createAppError(
            `Invalid ${fieldName.toLowerCase()} format`,
            ErrorCodes.INVALID_INPUT,
            400,
            context
        );
    }

    return date;
}

export function validateDateRange(
    startDateString: string,
    endDateString: string,
    maxDays: number = 90,
    context?: ErrorContext
): { startDate: Date; endDate: Date } {
    const startDate = validateDate(startDateString, 'Start date', context);
    const endDate = validateDate(endDateString, 'End date', context);

    if (startDate > endDate) {
        throw createAppError(
            'Start date must be before end date',
            ErrorCodes.DATE_RANGE_ERROR,
            400,
            context
        );
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
        throw createAppError(
            `Date range cannot exceed ${maxDays} days`,
            ErrorCodes.DATE_RANGE_ERROR,
            400,
            context
        );
    }

    return { startDate, endDate };
}

export function getErrorCodeFromError(error: Error): ErrorCode {
    if (error.message.includes('not found')) {
        return ErrorCodes.RESOURCE_NOT_FOUND;
    }
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        return ErrorCodes.UNAUTHORIZED;
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
        return ErrorCodes.NETWORK_ERROR;
    }
    if (error.message.includes('database') || error.message.includes('connection')) {
        return ErrorCodes.DATABASE_ERROR;
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
        return ErrorCodes.VALIDATION_ERROR;
    }
    return ErrorCodes.UNKNOWN_ERROR;
}

export function createServiceError(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    context?: ErrorContext
): ServiceError {
    return new ServiceError(message, code, statusCode, context);
}

export async function withPerformanceTracking<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
): Promise<T> {
    const startTime = Date.now();

    addSentryBreadcrumb(`Performance tracking started for ${operationName}`, 'performance', 'info');

    try {
        const result = await operation();
        const duration = Date.now() - startTime;

        addSentryBreadcrumb(
            `${operationName} completed in ${duration}ms`,
            'performance',
            'info'
        );

        if (duration > 5000) {
            logError(new Error(`Slow operation detected: ${operationName}`), {
                level: 'warning',
                context: {
                    ...context,
                    action: operationName,
                    additionalData: {
                        duration,
                        performanceIssue: true,
                    },
                },
                tags: {
                    performance: 'slow',
                    operation: operationName,
                },
            });
        }

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;

        addSentryBreadcrumb(
            `${operationName} failed after ${duration}ms`,
            'performance',
            'error'
        );

        throw error;
    }
} 