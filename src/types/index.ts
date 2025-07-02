export interface PriceRecord {
    timestamp: number;
    price: number;
    currency: string;
}

export interface UsageRecord {
    timestamp: number;
    kwh: number;
}

export interface ElectricityData {
    meteringPointId: string;
    date: string;
    usage: UsageRecord[];
    prices: PriceRecord[];
}

export interface CostAnalysis {
    meteringPointId: string;
    date: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakUsageHour: number;
    peakCostHour: number;
    suggestions: string[];
}

export interface Customer {
    name: string;
    owner: string;
    meteringPoints: string[];
}

export interface MeteringPoint {
    id: string;
    name: string;
    location?: string;
    customerId?: string;
}

export interface HourlyData {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export interface DailyAnalytics {
    date: string;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    peakHour: number;
    offPeakHour: number;
}

export interface WeeklyAnalytics {
    weekStart: string;
    weekEnd: string;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    dailyBreakdown: DailyAnalytics[];
}

export interface MonthlyAnalytics {
    month: string;
    year: number;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    weeklyBreakdown: WeeklyAnalytics[];
}

export interface InsightData {
    meteringPointId: string;
    date: string;
    insights: {
        highUsagePeriods: Array<{
            hour: number;
            usage: number;
            cost: number;
        }>;
        lowCostOpportunities: Array<{
            hour: number;
            potentialSavings: number;
            recommendation: string;
        }>;
        trends: {
            usageTrend: 'increasing' | 'decreasing' | 'stable';
            costTrend: 'increasing' | 'decreasing' | 'stable';
            efficiency: number;
        };
    };
}

export interface DashboardData {
    totalMeteringPoints: number;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    meteringPoints: Array<{
        id: string;
        name: string;
        todayUsage: number;
        todayCost: number;
        status: 'normal' | 'high' | 'alert';
    }>;
    recentAnalytics: DailyAnalytics[];
} 