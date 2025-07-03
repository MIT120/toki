import { useCallback } from 'react';

import { useDashboardAnalytics } from '../contexts/analytics-context';
import {
    trackCostAnalysisAction,
    trackDataExportAction,
    trackErrorAction,
    trackEventAction,
    trackFilterApplicationAction,
    trackInsightViewAction,
    trackMeteringPointInteractionAction,
    trackPerformanceAction,
} from '../services/analytics-service';
import { AnalyticsCallbacks, AnalyticsContext, AnalyticsEventProperties, AnalyticsProperties, RefreshAnalyticsOptions, UserAction } from '../types';
import { logError } from './error-logger';

/**
 * Centralized analytics event definitions
 * Use these constants instead of hardcoding event names
 */
export const ANALYTICS_EVENTS = {
    // Query Events
    COST_ANALYSIS_LOADED: 'cost_analysis_loaded',
    COST_ANALYSIS_REFRESHED: 'cost_analysis_refreshed',
    HOURLY_DATA_LOADED: 'hourly_data_loaded',
    HOURLY_DATA_REFRESHED: 'hourly_data_refreshed',
    INSIGHTS_LOADED: 'insights_loaded',
    INSIGHTS_REFRESHED: 'insights_refreshed',
    DASHBOARD_LOADED: 'dashboard_loaded',
    DASHBOARD_REFRESHED: 'dashboard_refreshed',

    // Performance Events
    QUERY_PERFORMANCE: 'query_performance',
    COMPONENT_PERFORMANCE: 'component_performance',

    // Error Events
    QUERY_ERROR: 'query_error',
    COMPONENT_ERROR: 'component_error',
} as const;

// Analytics event properties builders
export const buildQueryEventProperties = (
    meteringPointId: string,
    additionalProps: Record<string, any> = {}
): AnalyticsEventProperties => ({
    metering_point_id: meteringPointId,
    timestamp: new Date().toISOString(),
    ...additionalProps,
});

export const buildPerformanceEventProperties = (
    componentName: string,
    loadTime: number,
    apiEndpoint?: string,
    additionalProps: Record<string, any> = {}
): AnalyticsEventProperties => ({
    component_name: componentName,
    load_time: loadTime,
    api_endpoint: apiEndpoint,
    timestamp: new Date().toISOString(),
    ...additionalProps,
});

export const buildErrorEventProperties = (
    error: Error,
    context: {
        component?: string;
        apiEndpoint?: string;
        userAction?: UserAction;
    } = {},
    additionalProps: Record<string, any> = {}
): AnalyticsEventProperties => ({
    error_message: error.message,
    error_stack: error.stack,
    component_name: context.component,
    api_endpoint: context.apiEndpoint,
    action_type: context.userAction,
    timestamp: new Date().toISOString(),
    ...additionalProps,
});

// Reusable analytics patterns
export interface AnalyticsWrapperOptions {
    enableAnalytics?: boolean;
    componentName: string;
    apiEndpoint?: string;
}

/**
 * Centralized PostHog analytics wrapper that provides reusable analytics patterns
 * 
 * @example
 * ```typescript
 * // In a React Query hook
 * const analytics = useAnalyticsWrapper({
 *   componentName: 'CostAnalysisQuery',
 *   apiEndpoint: '/api/electricity/123/analysis'
 * });
 * 
 * const query = useQuery({
 *   queryKey: ['cost-analysis', meteringPointId],
 *   queryFn: analytics.wrapQueryWithAnalytics(
 *     () => fetchCostAnalysis(meteringPointId),
 *     {
 *       meteringPointId,
 *       queryType: 'cost_analysis',
 *       onSuccess: (data) => ({ totalCost: data.totalCost })
 *     }
 *   )
 * });
 * ```
 */
export function useAnalyticsWrapper(options: AnalyticsWrapperOptions) {
    const { enableAnalytics = true, componentName, apiEndpoint } = options;
    const analytics = useDashboardAnalytics();

    // Generic event tracking with consistent patterns
    const trackEvent = useCallback(
        async (
            eventName: string,
            properties: Record<string, any> = {}
        ) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackEvent(eventName, {
                    component_name: componentName,
                    api_endpoint: apiEndpoint,
                    timestamp: new Date().toISOString(),
                    ...properties,
                });
            } catch (error) {
                console.error('Failed to track event:', error);
            }
        },
        [enableAnalytics, analytics, componentName, apiEndpoint]
    );

    // Performance tracking wrapper
    const trackPerformance = useCallback(
        async (loadTime: number, additionalProps: Record<string, any> = {}) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackPerformance({
                    componentName,
                    loadTime,
                    apiEndpoint,
                    ...additionalProps,
                });
            } catch (error) {
                console.error('Failed to track performance:', error);
            }
        },
        [enableAnalytics, analytics, componentName, apiEndpoint]
    );

    // Error tracking wrapper
    const trackError = useCallback(
        async (
            error: Error,
            context: { userAction?: UserAction } = {},
            additionalProps: Record<string, any> = {}
        ) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackErrorWithContext(error, {
                    component: componentName,
                    apiEndpoint,
                    userAction: context.userAction || 'view',
                    ...additionalProps,
                });
            } catch (error) {
                console.error('Failed to track error:', error);
            }
        },
        [enableAnalytics, analytics, componentName, apiEndpoint]
    );

    // Cost analysis specific tracking
    const trackCostAnalysis = useCallback(
        async (
            meteringPointId: string,
            analysisData: {
                totalKwh: number;
                totalCost: number;
                averagePrice: number;
                peakUsageHour: number;
                potentialSavings?: number;
            }
        ) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackCostAnalysis(meteringPointId, {
                    ...analysisData,
                    potentialSavings: analysisData.potentialSavings || analysisData.totalCost * 0.15,
                });
            } catch (error) {
                console.error('Failed to track cost analysis:', error);
            }
        },
        [enableAnalytics, analytics]
    );

    // Query refresh tracking
    const trackRefresh = useCallback(
        async (
            refreshType: string,
            meteringPointId?: string,
            additionalProps: Record<string, any> = {}
        ) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackEvent(`${refreshType}_refreshed`, {
                    metering_point_id: meteringPointId,
                    component_name: componentName,
                    timestamp: new Date().toISOString(),
                    ...additionalProps,
                });
            } catch (error) {
                console.error('Failed to track refresh:', error);
            }
        },
        [enableAnalytics, analytics, componentName]
    );

    // Performance measurement utility
    const measurePerformance = useCallback(
        async <T>(
            operation: () => Promise<T>,
            operationName?: string,
            additionalProps: Record<string, any> = {}
        ): Promise<T> => {
            const startTime = Date.now();

            try {
                const result = await operation();
                const loadTime = Date.now() - startTime;

                await trackPerformance(loadTime, {
                    operation_name: operationName,
                    ...additionalProps,
                });

                return result;
            } catch (error) {
                const loadTime = Date.now() - startTime;

                await trackError(error as Error, {
                    userAction: 'analyze',
                }, {
                    load_time: loadTime,
                    operation_name: operationName,
                    ...additionalProps,
                });

                throw error;
            }
        },
        [trackPerformance, trackError]
    );

    // Query wrapper with built-in analytics
    const wrapQueryWithAnalytics = useCallback(
        <T>(
            queryFn: () => Promise<T>,
            options: {
                meteringPointId?: string;
                queryType: string;
                onSuccess?: (data: T) => Record<string, any>;
                onError?: (error: Error) => Record<string, any>;
            }
        ) => {
            return async (): Promise<T> => {
                const startTime = Date.now();

                try {
                    const result = await queryFn();
                    const loadTime = Date.now() - startTime;

                    // Track successful query
                    await trackEvent(`${options.queryType}_loaded`, {
                        metering_point_id: options.meteringPointId,
                        load_time: loadTime,
                        success: true,
                        ...(options.onSuccess ? options.onSuccess(result) : {}),
                    });

                    // Track performance
                    await trackPerformance(loadTime, {
                        query_type: options.queryType,
                        metering_point_id: options.meteringPointId,
                    });

                    return result;
                } catch (error) {
                    const loadTime = Date.now() - startTime;

                    // Track error
                    await trackError(error as Error, {
                        userAction: 'view',
                    }, {
                        metering_point_id: options.meteringPointId,
                        load_time: loadTime,
                        query_type: options.queryType,
                        fetch_operation: `fetch_${options.queryType}`,
                        ...(options.onError ? options.onError(error as Error) : {}),
                    });

                    throw error;
                }
            };
        },
        [trackEvent, trackPerformance, trackError]
    );

    // Refresh wrapper with built-in analytics
    const wrapRefreshWithAnalytics = useCallback(
        (
            refreshFn: () => Promise<any>,
            options: {
                meteringPointId?: string;
                refreshType: string;
                additionalProps?: Record<string, any>;
            }
        ) => {
            return async () => {
                await trackRefresh(options.refreshType, options.meteringPointId, options.additionalProps);
                return refreshFn();
            };
        },
        [trackRefresh]
    );

    return {
        // Core tracking methods
        trackEvent,
        trackPerformance,
        trackError,
        trackCostAnalysis,
        trackRefresh,

        // Utility methods
        measurePerformance,
        wrapQueryWithAnalytics,
        wrapRefreshWithAnalytics,

        // Analytics state
        isEnabled: enableAnalytics && analytics.isInitialized,
        analytics,
    };
}

/**
 * Specialized analytics hook for cost analysis queries
 * Provides pre-configured analytics tracking for cost analysis operations
 * 
 * @param meteringPointId - The metering point ID being analyzed
 * @param enableAnalytics - Whether to enable analytics tracking
 * @returns Analytics wrapper with cost analysis specific configuration
 * 
 * @example
 * ```typescript
 * const analytics = useCostAnalysisAnalytics(meteringPointId);
 * 
 * // Use with React Query
 * const query = useQuery({
 *   queryFn: analytics.wrapQueryWithAnalytics(fetchFn, {
 *     meteringPointId,
 *     queryType: 'cost_analysis'
 *   })
 * });
 * ```
 */
export function useCostAnalysisAnalytics(meteringPointId: string, enableAnalytics = true) {
    return useAnalyticsWrapper({
        enableAnalytics,
        componentName: 'CostAnalysisQuery',
        apiEndpoint: `/api/electricity/${meteringPointId}/analysis`,
    });
}

/**
 * Specialized analytics hook for hourly data queries
 */
export function useHourlyDataAnalytics(meteringPointId: string, enableAnalytics = true) {
    return useAnalyticsWrapper({
        enableAnalytics,
        componentName: 'HourlyDataQuery',
        apiEndpoint: `/api/electricity/${meteringPointId}/hourly`,
    });
}

/**
 * Specialized analytics hook for insights queries
 */
export function useInsightsAnalytics(meteringPointId: string, enableAnalytics = true) {
    return useAnalyticsWrapper({
        enableAnalytics,
        componentName: 'InsightsQuery',
        apiEndpoint: `/api/insights/${meteringPointId}`,
    });
}

/**
 * Specialized analytics hook for dashboard queries
 */
export function useDashboardQueryAnalytics(enableAnalytics = true) {
    return useAnalyticsWrapper({
        enableAnalytics,
        componentName: 'DashboardQuery',
        apiEndpoint: '/api/dashboard',
    });
}

export const createAnalyticsWrapper = (baseContext: AnalyticsContext) => {
    const wrapWithAnalytics = <T extends (...args: unknown[]) => Promise<unknown>>(
        fn: T,
        eventName: string,
        getAnalyticsProps: (...args: Parameters<T>) => AnalyticsProperties = () => ({}),
        callbacks?: AnalyticsCallbacks<Awaited<ReturnType<T>>>
    ): T => {
        return (async (...args: Parameters<T>) => {
            const startTime = performance.now();
            const analyticsProps = getAnalyticsProps(...args);

            try {
                const result = await fn(...args);
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                // Track successful execution
                const successProps = callbacks?.onSuccess?.(result as Awaited<ReturnType<T>>) || {};
                await trackEventAction(eventName, {
                    ...analyticsProps,
                    ...successProps,
                    load_time: loadTime,
                    success: true,
                }, baseContext.userId);

                return result;
            } catch (error) {
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                // Track error
                const errorProps = callbacks?.onError?.(error as Error) || {};
                await trackEventAction(eventName, {
                    ...analyticsProps,
                    ...errorProps,
                    load_time: loadTime,
                    success: false,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                }, baseContext.userId);

                // Also log to error logger
                logError(error as Error, {
                    level: 'error',
                    context: {
                        component: baseContext.component,
                        userId: baseContext.userId,
                        userAction: baseContext.userAction,
                        additionalData: analyticsProps,
                    },
                });

                throw error;
            }
        }) as T;
    };

    return {
        wrapWithAnalytics,

        // Dashboard analytics
        wrapDashboardAction: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            additionalProps: AnalyticsProperties = {}
        ) => wrapWithAnalytics(
            fn,
            'dashboard_action',
            () => ({
                component_name: 'dashboard',
                ...additionalProps,
            })
        ),

        // Cost analysis analytics
        wrapCostAnalysisAction: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            additionalProps: AnalyticsProperties = {}
        ) => wrapWithAnalytics(
            fn,
            'cost_analysis_action',
            () => ({
                component_name: 'cost-analysis',
                ...additionalProps,
            })
        ),

        // Hourly data analytics
        wrapHourlyDataAction: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            meteringPointId: string,
            additionalProps: AnalyticsProperties = {}
        ) => wrapWithAnalytics(
            fn,
            'hourly_data_action',
            () => ({
                component_name: 'hourly-data',
                metering_point_id: meteringPointId,
                ...additionalProps,
            })
        ),

        // Insights analytics
        wrapInsightsAction: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            additionalProps: AnalyticsProperties = {}
        ) => wrapWithAnalytics(
            fn,
            'insights_action',
            () => ({
                component_name: 'insights',
                ...additionalProps,
            })
        ),

        // Generic action wrapper
        wrapAction: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            eventName: string,
            getProps: (...args: Parameters<T>) => AnalyticsProperties = () => ({}),
            callbacks?: AnalyticsCallbacks<Awaited<ReturnType<T>>>
        ) => wrapWithAnalytics(fn, eventName, getProps, callbacks),

        // Performance tracking
        trackPerformance: async (componentName: string, operation: () => Promise<unknown>) => {
            const startTime = performance.now();
            try {
                const result = await operation();
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                await trackPerformanceAction(baseContext.userId, {
                    componentName,
                    loadTime,
                });

                return result;
            } catch (error) {
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                await trackPerformanceAction(baseContext.userId, {
                    componentName,
                    loadTime,
                });

                await trackErrorAction(baseContext.userId, error as Error, {
                    component: componentName,
                    userAction: baseContext.userAction,
                });

                throw error;
            }
        },

        // Simplified performance wrapper
        withPerformanceTracking: <T extends (...args: unknown[]) => Promise<unknown>>(
            fn: T,
            componentName: string
        ) => {
            return (async (...args: Parameters<T>) => {
                const startTime = performance.now();
                try {
                    const result = await fn(...args);
                    const endTime = performance.now();
                    const loadTime = endTime - startTime;

                    await trackPerformanceAction(baseContext.userId, {
                        componentName,
                        loadTime,
                    });

                    return result;
                } catch (error) {
                    const endTime = performance.now();
                    const loadTime = endTime - startTime;

                    await trackPerformanceAction(baseContext.userId, {
                        componentName,
                        loadTime,
                    });

                    await trackErrorAction(baseContext.userId, error as Error, {
                        component: componentName,
                        userAction: baseContext.userAction,
                    });

                    throw error;
                }
            }) as T;
        },

        // Error tracking
        trackError: async (error: Error, context: { component?: string; userAction?: UserAction } = {}) => {
            await trackErrorAction(baseContext.userId, error, {
                component: context.component || baseContext.component,
                userAction: context.userAction || baseContext.userAction,
            });

            logError(error, {
                level: 'error',
                context: {
                    component: context.component || baseContext.component,
                    userId: baseContext.userId,
                    userAction: context.userAction || baseContext.userAction,
                },
            });
        },

        // Event tracking
        trackEvent: async (eventName: string, properties: AnalyticsProperties = {}) => {
            await trackEventAction(eventName, {
                ...properties,
                component_name: baseContext.component,
                timestamp: new Date().toISOString(),
            }, baseContext.userId);
        },

        // Data loading wrapper with analytics
        wrapDataLoader: <T>(
            loader: () => Promise<T>,
            options: {
                componentName: string;
                dataType: string;
                additionalProps?: AnalyticsProperties;
            }
        ) => {
            return wrapWithAnalytics(
                loader,
                'data_loaded',
                () => ({
                    component_name: options.componentName,
                    data_type: options.dataType,
                    ...options.additionalProps,
                }),
                {
                    onSuccess: (data: unknown) => ({
                        data_loaded: true,
                        // Don't include the actual data in analytics for privacy
                        data_size: Array.isArray(data) ? data.length : 1,
                    }),
                    onError: (error: Error) => ({
                        data_loaded: false,
                        error_type: error.name,
                    }),
                }
            );
        },

        // Refresh action wrapper
        wrapRefreshAction: async (options: RefreshAnalyticsOptions) => {
            const startTime = performance.now();

            try {
                const result = await options.refreshFn();
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                await trackEventAction('data_refreshed', {
                    component_name: options.componentName,
                    load_time: loadTime,
                    success: true,
                    ...options.additionalProps,
                }, options.userId);

                return result;
            } catch (error) {
                const endTime = performance.now();
                const loadTime = endTime - startTime;

                await trackEventAction('data_refresh_failed', {
                    component_name: options.componentName,
                    load_time: loadTime,
                    success: false,
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                    ...options.additionalProps,
                }, options.userId);

                await trackErrorAction(options.userId, error as Error, {
                    component: options.componentName,
                    userAction: 'refresh',
                });

                throw error;
            }
        },
    };
};

/**
 * Analytics wrapper functions for common dashboard actions
 */


// Metering point interaction analytics  
export const trackMeteringPointClick = async (
    userId: string,
    meteringPointId: string,
    meteringPointName: string,
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackMeteringPointInteractionAction(
        userId,
        meteringPointId,
        meteringPointName,
        'select',
        {
            action_type: 'click',
            ...additionalProps,
        }
    );
};

// Cost analysis analytics
export const trackCostAnalysisView = async (
    userId: string,
    meteringPointId: string,
    analysisData: {
        totalKwh: number;
        totalCost: number;
        averagePrice: number;
        peakUsageHour: number;
        potentialSavings?: number;
    },
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackCostAnalysisAction(userId, meteringPointId, {
        ...analysisData,
        ...additionalProps,
    });
};

// Insight view analytics
export const trackInsightInteraction = async (
    userId: string,
    insightType: string,
    urgencyLevel: 'low' | 'medium' | 'high',
    potentialSavings?: number,
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackInsightViewAction(userId, insightType, urgencyLevel, potentialSavings);
};

// Filter application analytics
export const trackFilterApplication = async (
    userId: string,
    filterType: string,
    filterValue: string,
    componentName: string,
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackFilterApplicationAction(userId, filterType, filterValue, componentName);
};

// Data export analytics
export const trackDataExport = async (
    userId: string,
    exportType: string,
    dataRange: string,
    recordCount: number,
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackDataExportAction(userId, exportType, dataRange, recordCount);
};

// Error tracking analytics
export const trackError = async (
    userId: string,
    error: Error,
    context: {
        component?: string;
        apiEndpoint?: string;
        userAction?: UserAction;
    } = {},
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackErrorAction(userId, error, context);
};

// Performance tracking analytics
export const trackPerformance = async (
    userId: string,
    componentName: string,
    loadTime: number,
    additionalProps: AnalyticsEventProperties = {}
) => {
    return trackPerformanceAction(userId, {
        componentName,
        loadTime,
        ...additionalProps,
    });
};

// Generic event tracking
export const trackCustomEvent = async (
    userId: string,
    eventName: string,
    properties: AnalyticsEventProperties = {}
) => {
    return trackEventAction(eventName, properties, userId);
};

// Wrapper for async operations with automatic performance and error tracking
export const withAnalytics = async <T>(
    operation: () => Promise<T>,
    userId: string,
    componentName: string,
    eventName: string,
    additionalProps: AnalyticsEventProperties = {}
): Promise<T> => {
    const startTime = performance.now();

    try {
        const result = await operation();
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        // Track successful operation
        await trackEventAction(eventName, {
            component_name: componentName,
            load_time: loadTime,
            success: true,
            ...additionalProps,
        }, userId);

        return result;
    } catch (error) {
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        // Track failed operation
        await trackEventAction(`${eventName}_failed`, {
            component_name: componentName,
            load_time: loadTime,
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            ...additionalProps,
        }, userId);

        // Track error details
        await trackErrorAction(userId, error as Error, {
            component: componentName,
        });

        throw error;
    }
};

// Specific wrapper for data refresh operations
export const trackRefreshAction = async (
    refreshFn: () => Promise<unknown>,
    userId: string,
    componentName: string,
    additionalProps?: AnalyticsEventProperties
) => {
    return withAnalytics(
        refreshFn,
        userId,
        componentName,
        'data_refreshed',
        additionalProps
    );
}; 