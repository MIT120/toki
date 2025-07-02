import { PriceRecord, UsageRecord } from '../types';

export interface DataFetchResult<T> {
    data: T[];
    usedMockData: boolean;
    errors?: string[];
}

export async function fetchDataWithFallback<T>(
    fetchFn: () => Promise<T[]>,
    mockDataFn: () => T[],
    dataType: string
): Promise<DataFetchResult<T>> {
    try {
        const data = await fetchFn();

        if (data.length === 0) {
            console.log(`No ${dataType} data found, using mock data`);
            return {
                data: mockDataFn(),
                usedMockData: true
            };
        }

        return {
            data,
            usedMockData: false
        };
    } catch (error) {
        console.log(`Error fetching ${dataType} data, using mock data:`, error);
        return {
            data: mockDataFn(),
            usedMockData: true,
            errors: [error instanceof Error ? error.message : String(error)]
        };
    }
}

export function processDateRange(
    startDate: Date,
    endDate: Date,
    processFn: (date: Date) => Promise<any>
): Promise<any[]> {
    const promises: Promise<any>[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        promises.push(processFn(new Date(currentDate)));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return Promise.all(promises);
}

export function createHourlyDataMap<T>(initializer: (hour: number) => T): Map<number, T> {
    const map = new Map<number, T>();
    for (let hour = 0; hour < 24; hour++) {
        map.set(hour, initializer(hour));
    }
    return map;
}

export function combineUsageAndPriceData(
    usage: UsageRecord[],
    prices: PriceRecord[]
): Array<{
    hour: number;
    usage: number;
    price: number;
    cost: number;
}> {
    const hourlyMap = createHourlyDataMap(hour => ({
        hour,
        usage: 0,
        price: 0,
        cost: 0
    }));

    // Populate usage data
    for (const usageRecord of usage) {
        const hour = new Date(usageRecord.timestamp * 1000).getHours();
        const existing = hourlyMap.get(hour);
        if (existing) {
            existing.usage += usageRecord.kwh;
        }
    }

    // Populate price data
    for (const priceRecord of prices) {
        const hour = new Date(priceRecord.timestamp * 1000).getHours();
        const existing = hourlyMap.get(hour);
        if (existing) {
            existing.price = priceRecord.price;
        }
    }

    // Calculate costs
    for (const [hour, data] of hourlyMap) {
        data.cost = data.usage * data.price;
    }

    return Array.from(hourlyMap.values()).sort((a, b) => a.hour - b.hour);
}

export function validateDateRange(
    startDate: Date,
    endDate: Date,
    maxDays: number = 90
): { isValid: boolean; error?: string } {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    if (startDate > endDate) {
        return { isValid: false, error: 'Start date must be before end date' };
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
        return { isValid: false, error: `Date range cannot exceed ${maxDays} days` };
    }

    return { isValid: true };
}

export function roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
} 