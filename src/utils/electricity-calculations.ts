import { PriceRecord, UsageRecord } from '../types';

/**
 * Core calculation utilities for electricity data
 * Focused on bakery requirements: basic calculations, formatting, and analysis
 */

// =================== TIMESTAMP & HOUR UTILITIES ===================

export function getHourFromTimestamp(timestamp: number): number {
    return new Date(timestamp * 1000).getUTCHours();
}

export function timestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
}

export function formatHour(hour: number): string {
    const sign = hour < 0 ? '-' : '';
    const absHour = Math.abs(hour);
    return `${sign}${absHour.toString().padStart(2, '0')}:00`;
}

// =================== DATA MAPPING UTILITIES ===================

export function createPriceByHourMap(prices: PriceRecord[]): Map<number, number> {
    const priceMap = new Map<number, number>();
    for (const priceRecord of prices) {
        const hour = getHourFromTimestamp(priceRecord.timestamp);
        priceMap.set(hour, priceRecord.price);
    }
    return priceMap;
}

export function createUsageByHourMap(usage: UsageRecord[]): Map<number, number> {
    const usageMap = new Map<number, number>();
    for (const usageRecord of usage) {
        const hour = getHourFromTimestamp(usageRecord.timestamp);
        const currentUsage = usageMap.get(hour) || 0;
        usageMap.set(hour, currentUsage + usageRecord.kwh);
    }
    return usageMap;
}

// =================== BASIC CALCULATIONS ===================

export function calculateTotalUsage(usage: UsageRecord[]): number {
    return usage.reduce((sum, record) => sum + record.kwh, 0);
}

export function calculateTotalCost(usage: UsageRecord[], priceMap: Map<number, number>): number {
    return usage.reduce((sum, record) => {
        const hour = getHourFromTimestamp(record.timestamp);
        const price = priceMap.get(hour) || 0;
        return sum + (record.kwh * price);
    }, 0);
}

export function calculateAveragePrice(prices: PriceRecord[]): number {
    if (prices.length === 0) return 0;
    const totalPrice = prices.reduce((sum, record) => sum + record.price, 0);
    return totalPrice / prices.length;
}

// =================== PEAK ANALYSIS ===================

export interface PeakAnalysis {
    peakUsageHour: number;
    peakCostHour: number;
    maxUsage: number;
    maxCost: number;
}

export function calculatePeakAnalysis(
    usage: UsageRecord[],
    priceMap: Map<number, number>
): PeakAnalysis {
    let peakUsageHour = 0;
    let peakCostHour = 0;
    let maxUsage = 0;
    let maxCost = 0;

    for (const usageRecord of usage) {
        const hour = getHourFromTimestamp(usageRecord.timestamp);
        const price = priceMap.get(hour) || 0;
        const cost = usageRecord.kwh * price;

        if (usageRecord.kwh > maxUsage) {
            maxUsage = usageRecord.kwh;
            peakUsageHour = hour;
        }

        if (cost > maxCost) {
            maxCost = cost;
            peakCostHour = hour;
        }
    }

    return { peakUsageHour, peakCostHour, maxUsage, maxCost };
}

// =================== HOURLY DATA AGGREGATION ===================

export interface HourlyDataPoint {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export function createHourlyDataPoints(
    usage: UsageRecord[],
    prices: PriceRecord[]
): HourlyDataPoint[] {
    const priceMap = createPriceByHourMap(prices);
    const usageMap = createUsageByHourMap(usage);

    const hourlyData: HourlyDataPoint[] = [];

    // Initialize all 24 hours
    for (let hour = 0; hour < 24; hour++) {
        const hourUsage = usageMap.get(hour) || 0;
        const hourPrice = priceMap.get(hour) || 0;
        const hourCost = hourUsage * hourPrice;

        hourlyData.push({
            hour,
            usage: hourUsage,
            price: hourPrice,
            cost: hourCost
        });
    }

    return hourlyData.sort((a, b) => a.hour - b.hour);
}

// =================== PRICE ANALYSIS ===================

export interface PriceThresholds {
    high: number;
    low: number;
    average: number;
}

export function calculatePriceThresholds(
    prices: PriceRecord[],
    highMultiplier: number = 1.2,
    lowMultiplier: number = 0.8
): PriceThresholds {
    const average = calculateAveragePrice(prices);
    return {
        high: average * highMultiplier,
        low: average * lowMultiplier,
        average
    };
}

export function findLowPriceHours(
    prices: PriceRecord[],
    threshold?: number
): number[] {
    const thresholds = calculatePriceThresholds(prices);
    const targetThreshold = threshold || thresholds.low;

    return prices
        .filter(p => p.price < targetThreshold)
        .map(p => getHourFromTimestamp(p.timestamp));
}

// =================== EFFICIENCY ANALYSIS ===================

export function calculateEfficiencyScore(usage: UsageRecord[]): number {
    if (usage.length === 0) return 50; // Default neutral score

    // Simple efficiency based on consistent usage patterns
    const hourlyUsage = createUsageByHourMap(usage);
    const usageValues = Array.from(hourlyUsage.values());

    if (usageValues.length === 0) return 50;

    const avgUsage = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
    const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - avgUsage, 2), 0) / usageValues.length;
    const coefficient = variance / (avgUsage || 1);

    // Lower coefficient means more consistent usage = higher efficiency
    return Math.max(0, Math.min(100, 100 - (coefficient * 50)));
}

// =================== COMPLETE ANALYSIS ===================

export interface ElectricityAnalysisResult {
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakAnalysis: PeakAnalysis;
    hourlyData: HourlyDataPoint[];
    priceThresholds: PriceThresholds;
    efficiencyScore: number;
}

export function performCompleteElectricityAnalysis(
    usage: UsageRecord[],
    prices: PriceRecord[]
): ElectricityAnalysisResult {
    const priceMap = createPriceByHourMap(prices);

    return {
        totalKwh: calculateTotalUsage(usage),
        totalCost: calculateTotalCost(usage, priceMap),
        averagePrice: calculateAveragePrice(prices),
        peakAnalysis: calculatePeakAnalysis(usage, priceMap),
        hourlyData: createHourlyDataPoints(usage, prices),
        priceThresholds: calculatePriceThresholds(prices),
        efficiencyScore: calculateEfficiencyScore(usage)
    };
}

// =================== FORMATTING UTILITIES ===================

export function roundToDecimals(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function roundCurrency(value: number): number {
    return roundToDecimals(value, 2);
}

export function roundPrice(value: number): number {
    return roundToDecimals(value, 4);
}

export function roundUsage(value: number): number {
    return roundToDecimals(value, 2);
} 