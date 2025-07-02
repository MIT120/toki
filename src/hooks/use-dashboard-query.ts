"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDashboardAnalytics } from '../contexts/analytics-context';

interface DashboardOverview {
    customer: {
        name: string;
        owner: string;
    };
    meteringPoints: Array<{
        id: string;
        name: string;
        location?: string;
    }>;
    todayData: {
        totalKwh: number;
        totalCost: number;
        averagePrice: number;
        activeMeters: number;
    };
    recentInsights: string[];
    quickStats: {
        highestCostMeter: string;
        peakUsageHour: number;
        potentialSavingsToday: number;
    };
}

interface DashboardResponse {
    success: boolean;
    data: DashboardOverview;
    error?: string;
}

// Dashboard data fetcher function
async function fetchDashboardData(date?: string): Promise<DashboardOverview> {
    const url = date ? `/api/dashboard?date=${date}` : '/api/dashboard';
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DashboardResponse = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
    }

    return data.data;
}

// Query key factory
export const dashboardKeys = {
    all: ['dashboard'] as const,
    overview: (date?: string) => [...dashboardKeys.all, 'overview', date] as const,
    meteringPoint: (id: string) => [...dashboardKeys.all, 'meteringPoint', id] as const,
    insights: (meteringPointId: string, date?: string) => [...dashboardKeys.all, 'insights', meteringPointId, date] as const,
    hourlyData: (meteringPointId: string, date: string) => [...dashboardKeys.all, 'hourlyData', meteringPointId, date] as const,
    costAnalysis: (meteringPointId: string, date: string) => [...dashboardKeys.all, 'costAnalysis', meteringPointId, date] as const,
};

interface UseDashboardQueryOptions {
    date?: string;
    enabled?: boolean;
    enableAnalytics?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
}

export function useDashboardQuery(options: UseDashboardQueryOptions = {}) {
    const {
        date,
        enabled = true,
        enableAnalytics = true,
        staleTime = 1000 * 60 * 5, // 5 minutes
        refetchInterval = false,
    } = options;

    const analytics = useDashboardAnalytics();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: dashboardKeys.overview(date),
        queryFn: () => {
            const startTime = Date.now();
            return fetchDashboardData(date).then(data => {
                const loadTime = Date.now() - startTime;

                // Track successful dashboard view with analytics
                if (enableAnalytics && analytics.isInitialized) {
                    analytics.trackDashboardViewWithContext({
                        meteringPointsCount: data.meteringPoints.length,
                        totalConsumption: data.todayData.totalKwh,
                        totalCost: data.todayData.totalCost,
                        loadTime,
                        date,
                    });

                    // Track performance metrics
                    analytics.trackPerformance({
                        componentName: 'DashboardQuery',
                        loadTime,
                        apiEndpoint: '/api/dashboard',
                        dataPointsCount: data.meteringPoints.length,
                    });
                }

                return data;
            });
        },
        enabled,
        staleTime,
        refetchInterval,
        retry: (failureCount, error) => {
            // Track errors with analytics
            if (enableAnalytics && analytics.isInitialized && error instanceof Error) {
                analytics.trackErrorWithContext(error, {
                    component: 'DashboardQuery',
                    apiEndpoint: '/api/dashboard',
                    userAction: 'fetch_dashboard_data',
                });
            }

            // Don't retry on 4xx errors
            if (error instanceof Error && 'status' in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) {
                    return false;
                }
            }
            return failureCount < 3;
        },
    });

    // Track page view when data is successfully loaded for the first time
    useEffect(() => {
        if (enableAnalytics && analytics.isInitialized && query.data && query.isSuccess) {
            analytics.trackPageViewWithContext('/dashboard');
        }
    }, [query.data, query.isSuccess, analytics, enableAnalytics]);

    // Enhanced refetch function with analytics
    const refetchWithAnalytics = async () => {
        if (enableAnalytics && analytics.isInitialized) {
            await analytics.trackEvent('dashboard_refreshed', {
                component_name: 'DashboardQuery',
                date,
            });
        }
        return query.refetch();
    };

    // Invalidate and refetch
    const invalidateAndRefetch = async () => {
        await queryClient.invalidateQueries({
            queryKey: dashboardKeys.overview(date)
        });
        return refetchWithAnalytics();
    };

    // Prefetch dashboard data for a different date
    const prefetchDashboard = (prefetchDate?: string) => {
        return queryClient.prefetchQuery({
            queryKey: dashboardKeys.overview(prefetchDate),
            queryFn: () => fetchDashboardData(prefetchDate),
            staleTime,
        });
    };

    return {
        // Data and states
        data: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isSuccess: query.isSuccess,
        isFetching: query.isFetching,
        isRefetching: query.isRefetching,

        // Actions
        refetch: refetchWithAnalytics,
        invalidateAndRefetch,
        prefetchDashboard,

        // React Query specific
        dataUpdatedAt: query.dataUpdatedAt,
        errorUpdatedAt: query.errorUpdatedAt,
        failureCount: query.failureCount,
        failureReason: query.failureReason,
        fetchStatus: query.fetchStatus,
        status: query.status,
    };
}