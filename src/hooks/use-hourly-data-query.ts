"use client";

import { useQuery } from '@tanstack/react-query';
import { HourlyData } from '../types';
import { useHourlyDataAnalytics } from '../utils/analytics-wrapper';
import { dashboardKeys } from './use-dashboard-query';

interface HourlyDataResponse {
    success: boolean;
    data: HourlyData[];
    error?: string;
}

// Hourly data fetcher function
async function fetchHourlyData(meteringPointId: string, date: string): Promise<HourlyData[]> {
    const response = await fetch(`/api/electricity/${meteringPointId}/hourly?date=${date}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: HourlyDataResponse = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch hourly data');
    }

    return data.data || [];
}

interface UseHourlyDataQueryOptions {
    enabled?: boolean;
    enableAnalytics?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
}

export function useHourlyDataQuery(
    meteringPointId: string,
    date: string,
    options: UseHourlyDataQueryOptions = {}
) {
    const {
        enabled = true,
        enableAnalytics = true,
        staleTime = 1000 * 60 * 2, // 2 minutes for hourly data
        refetchInterval = false,
    } = options;

    const analytics = useHourlyDataAnalytics(meteringPointId, enableAnalytics);

    const query = useQuery({
        queryKey: dashboardKeys.hourlyData(meteringPointId, date),
        queryFn: analytics.wrapQueryWithAnalytics(
            () => fetchHourlyData(meteringPointId, date),
            {
                meteringPointId,
                queryType: 'hourly_data',
                onSuccess: (data: HourlyData[]) => ({
                    data_points_count: data.length,
                    date,
                }),
            }
        ),
        enabled: enabled && !!meteringPointId && !!date,
        staleTime,
        refetchInterval,
        retry: (failureCount, error) => {
            if (error instanceof Error) {
                analytics.trackError(error, { userAction: 'fetch_hourly_data' });
            }
            return failureCount < 3;
        },
    });

    const refetch = analytics.wrapRefreshWithAnalytics(
        () => query.refetch(),
        {
            meteringPointId,
            refreshType: 'hourly_data',
            additionalProps: { date },
        }
    );

    return {
        ...query,
        refetch,
    };
} 