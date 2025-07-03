import { AnalyticsProperties, ServiceResponse } from '../../../types';
import type { MetricData } from '../../common/types';

export interface Customer {
    id: string;
    name: string;
    owner: string;
    meteringPoints: MeteringPoint[];
}

export interface MeteringPoint {
    id: string;
    name: string;
    location?: string;
    todayUsage: number;
    todayCost: number;
    status: 'normal' | 'high' | 'alert';
}

export interface TodayData {
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    activeMeters: number;
}

export interface QuickStats {
    peakUsageHour: number;
    highestCostMeter: string;
    potentialSavingsToday: number;
}

export interface DashboardData {
    customer: Customer;
    meteringPoints: MeteringPoint[];
    todayData: TodayData;
    recentInsights: string[];
    quickStats: QuickStats;
}

export interface DashboardOverviewProps {
    date?: string;
}

export interface DashboardOverviewContentProps {
    dashboardData: DashboardData;
    isLoading: boolean;
    error: Error | null;
    lastRefresh: Date | null;
    analyticsHandlers: AnalyticsHandlers;
}

export interface DashboardContentProps {
    dashboardData: DashboardData;
    metricsData: MetricData[];
    isRefetching: boolean;
    isFetching: boolean;
    onRefetch: () => void;
    analytics: AnalyticsHandlers;
}

export interface AnalyticsHandlers {
    handleMeteringPointClick: (meteringPoint: MeteringPoint) => Promise<void>;
    handleInsightView: (insight: string, index: number) => Promise<void>;
    handleMetricCardClick: (metricType: string, additionalProps?: AnalyticsProperties) => Promise<void>;
    handleEfficiencyScoreClick: (score: number) => Promise<void>;
}

export interface DashboardQueryResult extends ServiceResponse<DashboardData> {
    lastRefresh?: Date;
} 