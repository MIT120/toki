import type { MetricData } from '../../common/types';

export interface HourlyDataPoint {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export interface HourlyChartProps {
    meteringPointId: string;
    date: string;
    title?: string;
}

export interface HourlyChartContentProps {
    title: string;
    date: string;
    hourlyData: HourlyDataPoint[];
    metricsData: MetricData[];
    isRefetching: boolean;
    isFetching: boolean;
    onRefetch: () => void;
    CustomTooltip: React.ComponentType<TooltipProps>;
}



export interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        color: string;
        dataKey: string;
        value: number;
    }>;
    label?: string | number;
} 