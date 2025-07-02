"use client";

import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from './use-dashboard-query';

// Utility hook for invalidating all electricity data
export function useInvalidateElectricityData() {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.all
            });
        },
        invalidateHourlyData: (meteringPointId: string, date: string) => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.hourlyData(meteringPointId, date)
            });
        },
        invalidateCostAnalysis: (meteringPointId: string, date: string) => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.costAnalysis(meteringPointId, date)
            });
        },
        invalidateInsights: (meteringPointId: string, date?: string) => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.insights(meteringPointId, date)
            });
        },
        invalidateDashboard: (date?: string) => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.overview(date)
            });
        },
        invalidateMeteringPoint: (meteringPointId: string) => {
            return queryClient.invalidateQueries({
                queryKey: dashboardKeys.meteringPoint(meteringPointId)
            });
        },
    };
} 