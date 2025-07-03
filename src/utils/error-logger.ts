import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
    component?: string;
    userId?: string;
    userAction?: string;
    action?: string;
    apiEndpoint?: string;
    meteringPointId?: string;
    additionalData?: Record<string, string | number | boolean>;
}

export interface ErrorLogOptions {
    level?: 'error' | 'warning' | 'info' | 'fatal';
    tags?: Record<string, string>;
    fingerprint?: string[];
    context?: ErrorContext;
}

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context?: ErrorContext;

    constructor(
        message: string,
        code: string = 'UNKNOWN_ERROR',
        statusCode: number = 500,
        isOperational: boolean = true,
        context?: ErrorContext
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const ErrorCodes = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Data & Resources
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    METERING_POINT_NOT_FOUND: 'METERING_POINT_NOT_FOUND',
    DATA_PROCESSING_ERROR: 'DATA_PROCESSING_ERROR',

    // External Services
    API_ERROR: 'API_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',

    // Business Logic
    INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
    CALCULATION_ERROR: 'CALCULATION_ERROR',
    DATE_RANGE_ERROR: 'DATE_RANGE_ERROR',

    // System
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

class ErrorLogger {
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.isInitialized) return;

        // Set up global error handlers
        if (typeof window !== 'undefined') {
            // Client-side error handlers
            window.addEventListener('error', this.handleGlobalError.bind(this));
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        } else {
            // Server-side error handlers
            process.on('uncaughtException', this.handleUncaughtException.bind(this));
            process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
        }

        this.isInitialized = true;
    }

    private handleGlobalError(event: ErrorEvent) {
        this.logError(event.error || new Error(event.message), {
            level: 'error',
            context: {
                component: 'GlobalErrorHandler',
                userAction: 'unknown',
                additionalData: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
            },
        });
    }

    private handleUnhandledRejection(event: PromiseRejectionEvent | any) {
        // Handle undefined or null event.reason gracefully
        let error: Error;
        if (event && event.reason instanceof Error) {
            error = event.reason;
        } else if (event && event.reason !== undefined && event.reason !== null) {
            error = new Error(String(event.reason));
        } else {
            error = new Error('Unknown promise rejection');
        }

        this.logError(error, {
            level: 'error',
            context: {
                component: 'GlobalErrorHandler',
                userAction: 'promise_rejection',
            },
        });
    }

    private handleUncaughtException(error: Error) {
        this.logError(error, {
            level: 'fatal',
            context: {
                component: 'GlobalErrorHandler',
                userAction: 'uncaughtException',
            },
        });
    }

    public logError(error: Error | AppError, options: ErrorLogOptions = {}) {
        const {
            level = 'error',
            tags = {},
            fingerprint,
            context = {},
        } = options;

        // Enhanced context for AppError instances
        const enhancedContext = error instanceof AppError && error.context
            ? { ...context, ...error.context }
            : context;

        // Set Sentry scope with context
        Sentry.withScope((scope) => {
            // Set error level
            scope.setLevel(level);

            // Add tags
            Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });

            // Add context data
            if (enhancedContext.userId) {
                scope.setUser({ id: enhancedContext.userId });
            }

            if (enhancedContext.component) {
                scope.setTag('component', enhancedContext.component);
            }

            if (enhancedContext.userAction) {
                scope.setTag('user_action', enhancedContext.userAction);
            }

            if (enhancedContext.apiEndpoint) {
                scope.setTag('api_endpoint', enhancedContext.apiEndpoint);
            }

            // Add additional context data
            if (enhancedContext.additionalData) {
                scope.setContext('additional_data', enhancedContext.additionalData);
            }

            // Add error code for AppError instances
            if (error instanceof AppError) {
                scope.setTag('error_code', error.code);
                scope.setTag('status_code', error.statusCode.toString());
                scope.setTag('operational', error.isOperational.toString());
            }

            // Set fingerprint for grouping
            if (fingerprint) {
                scope.setFingerprint(fingerprint);
            }

            // Capture the error
            Sentry.captureException(error);
        });

        // Console logging for development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${level.toUpperCase()}]`, error.message, {
                error,
                context: enhancedContext,
                tags,
            });
        }
    }

    public logWarning(message: string, context?: ErrorContext) {
        this.logError(new Error(message), {
            level: 'warning',
            context,
        });
    }

    public logInfo(message: string, context?: ErrorContext) {
        this.logError(new Error(message), {
            level: 'info',
            context,
        });
    }

    public createAppError(
        message: string,
        code: ErrorCode,
        statusCode: number = 500,
        context?: ErrorContext
    ): AppError {
        const error = new AppError(message, code, statusCode, true, context);
        this.logError(error, { context });
        return error;
    }

    public async captureUserSentryFeedback(
        eventId: string,
        name: string,
        email: string,
        comments: string
    ) {
        Sentry.captureFeedback({
            name,
            email,
            message: comments,
            associatedEventId: eventId,
        });
    }

    public addSentryBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error') {
        Sentry.addBreadcrumb({
            message,
            category: category || 'custom',
            level: level || 'info',
            timestamp: Date.now() / 1000,
        });
    }

    public setUserSentryContext(userId: string, email?: string, name?: string) {
        Sentry.setUser({
            id: userId,
            email,
            username: name,
        });
    }

    public clearUserSentryContext() {
        Sentry.setUser(null);
    }

    public async flush(timeout: number = 2000): Promise<boolean> {
        return await Sentry.flush(timeout);
    }
}

export const errorLogger = new ErrorLogger();

export const logError = errorLogger.logError.bind(errorLogger);
export const logWarning = errorLogger.logWarning.bind(errorLogger);
export const logInfo = errorLogger.logInfo.bind(errorLogger);
export const createAppError = errorLogger.createAppError.bind(errorLogger);
export const addSentryBreadcrumb = errorLogger.addSentryBreadcrumb.bind(errorLogger);
export const setUserSentryContext = errorLogger.setUserSentryContext.bind(errorLogger);
export const clearUserSentryContext = errorLogger.clearUserSentryContext.bind(errorLogger);
export const flushSentryErrors = errorLogger.flush.bind(errorLogger); 