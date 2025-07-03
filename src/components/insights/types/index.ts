import type { MetricData, Recommendation } from '../../common/types';

export interface TodayTotal {
    usage: number;
    cost: number;
}

export interface Trends {
    usageChange: number;
    costChange: number;
    efficiencyScore: number;
}

export interface InsightsData {
    currentUsage: number;
    currentCost: number;
    currentPrice: number;
    hourProgress: number;
    lastUpdated: string;
    todayTotal: TodayTotal;
    trends: Trends;
    recommendations: string[] | Recommendation[];
}

export interface RealTimeInsightsProps {
    meteringPointId: string;
    date?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface RealTimeInsightsContentProps {
    insights: InsightsData;
    metricsData: MetricData[];
    formatTime: (date: Date) => string;
    isRefetching: boolean;
    isFetching: boolean;
    onRefetch: () => void;
}

