"use client";

import { useQuery } from '@tanstack/react-query';
import { CostAnalysis } from '../types';
import { useCostAnalysisAnalytics } from '../utils/analytics-wrapper';
import { dashboardKeys } from './use-dashboard-query';

interface CostAnalysisResponse {
    success: boolean;
    data: CostAnalysis;
    error?: string;
}

// Cost analysis fetcher function
async function fetchCostAnalysis(meteringPointId: string, date: string): Promise<CostAnalysis> {
    const response = await fetch(`/api/electricity/${meteringPointId}/analysis?date=${date}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: CostAnalysisResponse = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cost analysis');
    }

    return data.data;
}

interface UseCostAnalysisQueryOptions {
    enabled?: boolean;
    enableAnalytics?: boolean;
    staleTime?: number;
}

export function useCostAnalysisQuery(
    meteringPointId: string,
    date: string,
    options: UseCostAnalysisQueryOptions = {}
) {
    const {
        enabled = true,
        enableAnalytics = true,
        staleTime = 1000 * 60 * 5, // 5 minutes for analysis
    } = options;

    const analytics = useCostAnalysisAnalytics(meteringPointId, enableAnalytics);

    const query = useQuery({
        queryKey: dashboardKeys.costAnalysis(meteringPointId, date),
        queryFn: analytics.wrapQueryWithAnalytics(
            () => fetchCostAnalysis(meteringPointId, date),
            {
                meteringPointId,
                queryType: 'cost_analysis',
                onSuccess: (data: CostAnalysis) => ({
                    totalKwh: data.totalKwh,
                    totalCost: data.totalCost,
                    averagePrice: data.averagePrice,
                    peakUsageHour: data.peakUsageHour,
                    potentialSavings: data.totalCost * 0.15,
                }),
            }
        ),
        enabled: enabled && !!meteringPointId && !!date,
        staleTime,
        retry: (failureCount, error) => {
            if (error instanceof Error) {
                analytics.trackError(error, { userAction: 'analyze' });
            }
            return failureCount < 3;
        },
    });

    const refetch = analytics.wrapRefreshWithAnalytics(
        () => query.refetch(),
        {
            meteringPointId,
            refreshType: 'cost_analysis',
            additionalProps: { date },
        }
    );

    return {
        ...query,
        refetch,
    };
} 