import { useCallback } from 'react';
import { useDashboardAnalytics } from '../contexts/analytics-context';
import { AnalyticsEventProperties } from '../types';

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
        userAction?: string;
    } = {},
    additionalProps: Record<string, any> = {}
): AnalyticsEventProperties => ({
    error_message: error.message,
    error_stack: error.stack,
    component_name: context.component,
    api_endpoint: context.apiEndpoint,
    action_type: context.userAction as any,
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
            context: { userAction?: string } = {},
            additionalProps: Record<string, any> = {}
        ) => {
            if (!enableAnalytics || !analytics.isInitialized) return;

            try {
                await analytics.trackErrorWithContext(error, {
                    component: componentName,
                    apiEndpoint,
                    userAction: context.userAction,
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
                    userAction: operationName,
                }, {
                    load_time: loadTime,
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
                        userAction: `fetch_${options.queryType}`,
                    }, {
                        metering_point_id: options.meteringPointId,
                        load_time: loadTime,
                        query_type: options.queryType,
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