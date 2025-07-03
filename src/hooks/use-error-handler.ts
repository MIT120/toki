import { useCallback } from 'react';
import { toast } from 'sonner';
import { addSentryBreadcrumb, logError, type ErrorContext } from '../utils/error-logger';

export interface UseErrorHandlerOptions {
    context?: ErrorContext;
    showToast?: boolean;
    toastTitle?: string;
    onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
    const {
        context = {},
        showToast = true,
        toastTitle = 'Error',
        onError,
    } = options;

    const handleError = useCallback(
        (error: Error | string, additionalContext?: Partial<ErrorContext>) => {
            const errorInstance = typeof error === 'string' ? new Error(error) : error;

            const fullContext: ErrorContext = {
                ...context,
                ...additionalContext,
            };

            logError(errorInstance, {
                level: 'error',
                context: fullContext,
                tags: {
                    source: 'react_component',
                    component: fullContext.component || 'unknown',
                },
            });

            if (showToast) {
                toast.error(toastTitle, {
                    description: errorInstance.message,
                });
            }

            if (onError) {
                onError(errorInstance);
            }
        },
        [context, showToast, toastTitle, onError]
    );

    const handleAsyncError = useCallback(
        async <T>(
            asyncOperation: () => Promise<T>,
            operationName: string,
            additionalContext?: Partial<ErrorContext>
        ): Promise<T | null> => {
            try {
                addSentryBreadcrumb(`Starting ${operationName}`, 'user_action', 'info');
                const result = await asyncOperation();
                addSentryBreadcrumb(`${operationName} completed successfully`, 'user_action', 'info');
                return result;
            } catch (error) {
                const errorInstance = error instanceof Error ? error : new Error(String(error));

                handleError(errorInstance, {
                    action: operationName,
                    ...additionalContext,
                });

                return null;
            }
        },
        [handleError]
    );

    const handleServiceResponse = useCallback(
        <T>(
            response: { success: boolean; data?: T; error?: string; errorCode?: string },
            operationName: string,
            additionalContext?: Partial<ErrorContext>
        ): T | null => {
            if (response.success && response.data) {
                return response.data;
            }

            const errorMessage = response.error || 'An unexpected error occurred';
            const error = new Error(errorMessage);

            handleError(error, {
                action: operationName,
                additionalData: {
                    errorCode: response.errorCode || 'unknown',
                    serviceResponse: true,
                },
                ...additionalContext,
            });

            return null;
        },
        [handleError]
    );

    return {
        handleError,
        handleAsyncError,
        handleServiceResponse,
    };
} 