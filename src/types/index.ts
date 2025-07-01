export interface Config {
    pricesApiUrl: string;
    dataStoragePath: string;
    outputPath: string;
    currency: string;
    timezone: string;
}

export interface PriceRecord {
    timestamp: number;
    price: number;
    currency: string;
}

export interface UsageRecord {
    timestamp: number;
    kwh: number;
}

export interface Customer {
    name: string;
    owner: string;
    meteringPoints: string[];
}

export interface MeteringPoint {
    id: string;
    name?: string;
    location?: string;
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
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

export interface DataFetchOptions {
    meteringPointId?: string;
    startDate?: Date;
    endDate?: Date;
    includeAnalysis?: boolean;
}

export interface DailySummary {
    date: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakUsageHour: number;
    suggestions: string[];
}

export interface WeeklySummary {
    weekStartDate: string;
    weekEndDate: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    dailySummaries: DailySummary[];
    weeklyInsights: string[];
}

export interface MonthlySummary {
    month: string;
    year: number;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    costSavingsOpportunity: number;
    monthlySuggestions: string[];
}

export interface DashboardOverview {
    customer: {
        name: string;
        owner: string;
    };
    meteringPoints: MeteringPoint[];
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

export interface HourlyData {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export interface RealTimeInsights {
    meteringPointId: string;
    currentHour: number;
    currentUsage: number;
    currentPrice: number;
    currentCost: number;
    recommendation: string;
    urgencyLevel: 'low' | 'medium' | 'high';
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
