import { PriceRecord, UsageRecord } from '../types';

export function calculateTotalUsage(data: UsageRecord[] | { usage?: number; kwh?: number }[]): number {
    return data.reduce((sum, item) => {
        const usage = 'usage' in item ? item.usage : item.kwh;
        return sum + (usage || 0);
    }, 0);
}

export function calculateTotalCost(data: { cost: number }[]): number {
    return data.reduce((sum, item) => sum + item.cost, 0);
}

export function calculateAveragePrice(data: PriceRecord[] | { price: number }[]): number {
    if (data.length === 0) return 0;
    const totalPrice = data.reduce((sum, item) => sum + item.price, 0);
    return totalPrice / data.length;
}

export function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function findMaxValue<T>(data: T[], accessor: (item: T) => number): T | null {
    if (data.length === 0) return null;
    return data.reduce((max, item) => accessor(item) > accessor(max) ? item : max);
}

export function findMinValue<T>(data: T[], accessor: (item: T) => number): T | null {
    if (data.length === 0) return null;
    return data.reduce((min, item) => accessor(item) < accessor(min) ? item : min);
}

export function calculatePriceRange(prices: PriceRecord[]): { min: number; max: number; range: number } {
    if (prices.length === 0) return { min: 0, max: 0, range: 0 };

    const priceValues = prices.map(p => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);

    return {
        min,
        max,
        range: ((max - min) / min) * 100 // Percentage range
    };
}

export function calculateUsageStats(usage: UsageRecord[]): {
    total: number;
    average: number;
    peak: number;
    peakHour: number | null;
} {
    if (usage.length === 0) {
        return { total: 0, average: 0, peak: 0, peakHour: null };
    }

    const total = calculateTotalUsage(usage);
    const average = total / usage.length;
    const peakRecord = findMaxValue(usage, u => u.kwh);
    const peak = peakRecord?.kwh || 0;
    const peakHour = peakRecord ? new Date(peakRecord.timestamp * 1000).getHours() : null;

    return { total, average, peak, peakHour };
} 