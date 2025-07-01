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
