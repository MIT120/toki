
import type { MetricData, Recommendation } from '../../common/types';

export interface CostAnalysisData {
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakUsageHour: number;
    peakCostHour?: number;
    suggestions?: string[] | Recommendation[];
}



export interface CostAnalysisProps {
    meteringPointId: string;
    date: string;
}

export interface CostAnalysisContentProps {
    costData: CostAnalysisData;
    date: string;
    isRefetching: boolean;
    isFetching: boolean;
    onRefetch: () => void;
    metricsData: MetricData[];
}

