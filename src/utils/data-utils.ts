import { PriceRecord, UsageRecord } from '../types';
import { getHourFromTimestamp, roundToDecimals } from './electricity-calculations';

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
        console.error(`Error fetching ${dataType} data:`, error);
        console.log(`Falling back to mock ${dataType} data`);

        return {
            data: mockDataFn(),
            usedMockData: true,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

export function processDateRange<T>(
    startDate: Date,
    endDate: Date,
    processFn: (date: Date) => Promise<T>
): Promise<T[]> {
    const promises: Promise<T>[] = [];
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

    // Populate usage data using reusable utility
    for (const usageRecord of usage) {
        const hour = getHourFromTimestamp(usageRecord.timestamp);
        const existing = hourlyMap.get(hour);
        if (existing) {
            existing.usage += usageRecord.kwh;
        }
    }

    // Populate price data using reusable utility
    for (const priceRecord of prices) {
        const hour = getHourFromTimestamp(priceRecord.timestamp);
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

export function createTimeSeriesData<T extends { timestamp: number }>(
    data: T[],
    valueAccessor: (item: T) => number,
    labelFormat: 'hour' | 'date' = 'hour'
): Array<{ time: string; value: number; original: T }> {
    return data.map(item => ({
        time: labelFormat === 'hour'
            ? `${getHourFromTimestamp(item.timestamp).toString().padStart(2, '0')}:00`
            : new Date(item.timestamp * 1000).toISOString().split('T')[0],
        value: valueAccessor(item),
        original: item
    }));
}

export function aggregateByHour<T extends { timestamp: number }>(
    data: T[],
    valueAccessor: (item: T) => number
): Array<{ hour: number; total: number; count: number; average: number }> {
    const hourlyData = new Map<number, { total: number; count: number }>();

    for (const item of data) {
        const hour = getHourFromTimestamp(item.timestamp);
        const value = valueAccessor(item);

        const existing = hourlyData.get(hour) || { total: 0, count: 0 };
        hourlyData.set(hour, {
            total: existing.total + value,
            count: existing.count + 1
        });
    }

    return Array.from(hourlyData.entries())
        .map(([hour, { total, count }]) => ({
            hour,
            total: roundToDecimals(total, 4),
            count,
            average: roundToDecimals(total / count, 4)
        }))
        .sort((a, b) => a.hour - b.hour);
}

export function groupDataByDate<T extends { timestamp: number }>(
    data: T[]
): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    for (const item of data) {
        const date = new Date(item.timestamp * 1000).toISOString().split('T')[0];
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(item);
    }

    return grouped;
}

export function filterDataByDateRange<T extends { timestamp: number }>(
    data: T[],
    startDate: string,
    endDate: string
): T[] {
    const startTimestamp = new Date(startDate).getTime() / 1000;
    const endTimestamp = new Date(endDate).getTime() / 1000 + 86400; // End of day

    return data.filter(item =>
        item.timestamp >= startTimestamp && item.timestamp < endTimestamp
    );
}

export function calculateDataQuality<T extends { timestamp: number }>(
    data: T[],
    expectedCount: number = 24
): {
    completeness: number;
    hasGaps: boolean;
    gapHours?: number[];
} {
    const completeness = roundToDecimals((data.length / expectedCount) * 100, 1);
    const hasGaps = data.length < expectedCount;

    let gapHours: number[] | undefined;
    if (hasGaps && data.length > 0) {
        const presentHours = new Set(data.map(d => getHourFromTimestamp(d.timestamp)));
        gapHours = Array.from({ length: 24 }, (_, i) => i).filter(hour => !presentHours.has(hour));
    }

    return {
        completeness,
        hasGaps,
        gapHours
    };
} 