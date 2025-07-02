"use client";

import { useQuery } from '@tanstack/react-query';
import { useDashboardAnalytics } from '../contexts/analytics-context';
import { RealTimeInsights } from '../types';
import { dashboardKeys } from './use-dashboard-query';

interface InsightsResponse {
    success: boolean;
    data: RealTimeInsights;
    error?: string;
}

// Insights fetcher function
async function fetchInsights(meteringPointId: string, date?: string): Promise<RealTimeInsights> {
    const url = date
        ? `/api/insights/${meteringPointId}?date=${date}`
        : `/api/insights/${meteringPointId}`;

    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: InsightsResponse = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch insights');
    }

    return data.data;
}

interface UseInsightsQueryOptions {
    enabled?: boolean;
    enableAnalytics?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
}

export function useInsightsQuery(
    meteringPointId: string,
    date?: string,
    options: UseInsightsQueryOptions = {}
) {
    const {
        enabled = true,
        enableAnalytics = true,
        staleTime = 1000 * 60 * 10, // 10 minutes for insights
        refetchInterval = false,
    } = options;

    const analytics = useDashboardAnalytics();

    const query = useQuery({
        queryKey: dashboardKeys.insights(meteringPointId, date),
        queryFn: () => {
            const startTime = Date.now();
            return fetchInsights(meteringPointId, date).then(data => {
                const loadTime = Date.now() - startTime;

                // Track analytics
                if (enableAnalytics && analytics.isInitialized) {
                    // Track insights view based on urgency level
                    const urgencyLevel = data.urgencyLevel || 'medium';
                    analytics.trackInsightView('real_time_insights', urgencyLevel, data.potentialSavings);

                    analytics.trackEvent('insights_viewed', {
                        metering_point_id: meteringPointId,
                        date,
                        urgency_level: urgencyLevel,
                        potential_savings: data.potentialSavings,
                        component_name: 'InsightsQuery',
                        load_time: loadTime,
                    });

                    analytics.trackPerformance({
                        componentName: 'InsightsQuery',
                        loadTime,
                        apiEndpoint: `/api/insights/${meteringPointId}`,
                    });
                }

                return data;
            });
        },
        enabled: enabled && !!meteringPointId,
        staleTime,
        refetchInterval,
        retry: (failureCount, error) => {
            if (enableAnalytics && analytics.isInitialized && error instanceof Error) {
                analytics.trackErrorWithContext(error, {
                    component: 'InsightsQuery',
                    apiEndpoint: `/api/insights/${meteringPointId}`,
                    userAction: 'fetch_insights',
                });
            }
            return failureCount < 3;
        },
    });

    const refetchWithAnalytics = async () => {
        if (enableAnalytics && analytics.isInitialized) {
            await analytics.trackEvent('insights_refreshed', {
                metering_point_id: meteringPointId,
                date,
                component_name: 'InsightsQuery',
            });
        }
        return query.refetch();
    };

    return {
        ...query,
        refetch: refetchWithAnalytics,
    };
} 