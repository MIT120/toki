import { CostAnalysis, ElectricityData, PriceRecord, UsageRecord } from '../src/types';
import { validateMeteringPointAccess } from './customers';
import { getPricesForDate, getUsageForMeteringPointAndDate } from './index';
import {
    getUsageForMeteringPointAndDate as getUsageForMeteringPointAndDateFromUsageModule
} from './usage';

export async function getElectricityDataForDate(meteringPointId: string, date: Date): Promise<ElectricityData | null> {
    const hasAccess = await validateMeteringPointAccess(meteringPointId);
    if (!hasAccess) {
        throw new Error(`Access denied for metering point: ${meteringPointId}`);
    }

    const [usage, prices] = await Promise.all([
        getUsageForMeteringPointAndDateFromUsageModule(meteringPointId, date),
        getPricesForDate(date)
    ]);

    return {
        meteringPointId,
        date: date.toISOString().split('T')[0],
        usage,
        prices
    };
}

export async function getElectricityDataForDateRange(
    meteringPointId: string,
    startDate: Date,
    endDate: Date
): Promise<ElectricityData[]> {
    const hasAccess = await validateMeteringPointAccess(meteringPointId);
    if (!hasAccess) {
        throw new Error(`Access denied for metering point: ${meteringPointId}`);
    }

    const data: ElectricityData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayData = await getElectricityDataForDate(meteringPointId, new Date(currentDate));
        if (dayData) {
            data.push(dayData);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
}

export async function calculateCostAnalysis(
    meteringPointId: string,
    date: Date
): Promise<CostAnalysis | null> {
    try {
        console.log(`📊 Calculating cost analysis for ${meteringPointId} on ${date.toISOString().split('T')[0]}`);

        const [usage, prices] = await Promise.all([
            getUsageForMeteringPointAndDate(meteringPointId, date),
            getPricesForDate(date)
        ]);

        if (usage.length === 0 || prices.length === 0) {
            console.log(`❌ No GCS data available for ${meteringPointId} on ${date.toISOString().split('T')[0]}`);
            return null;
        }

        console.log(`🔢 Processing ${usage.length} usage records and ${prices.length} price records from GCS`);

        // Create hour-to-price mapping
        const priceMap = new Map<number, number>();
        for (const priceRecord of prices) {
            const hour = new Date(priceRecord.timestamp * 1000).getHours();
            priceMap.set(hour, priceRecord.price);
        }

        let totalKwh = 0;
        let totalCost = 0;
        let priceSum = 0;
        let peakUsageHour = 0;
        let peakCostHour = 0;
        let maxUsage = 0;
        let maxCost = 0;

        // Calculate metrics
        for (const usageRecord of usage) {
            const hour = new Date(usageRecord.timestamp * 1000).getHours();
            const price = priceMap.get(hour) || 0;
            const cost = usageRecord.kwh * price;

            totalKwh += usageRecord.kwh;
            totalCost += cost;
            priceSum += price;

            if (usageRecord.kwh > maxUsage) {
                maxUsage = usageRecord.kwh;
                peakUsageHour = hour;
            }

            if (cost > maxCost) {
                maxCost = cost;
                peakCostHour = hour;
            }
        }

        const averagePrice = priceSum / usage.length;

        // Generate intelligent suggestions
        const suggestions = generateCostSuggestions(usage, prices, averagePrice);

        return {
            meteringPointId,
            date: date.toISOString().split('T')[0],
            totalKwh: Math.round(totalKwh * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            averagePrice: Math.round(averagePrice * 10000) / 10000,
            peakUsageHour,
            peakCostHour,
            suggestions
        };
    } catch (error) {
        console.error('Error in calculateCostAnalysis:', error);
        return null;
    }
}

function generateCostSuggestions(
    usage: UsageRecord[],
    prices: PriceRecord[],
    averagePrice: number
): string[] {
    const suggestions: string[] = [];

    // Find peak usage hours
    const usageByHour = new Map<number, number>();
    for (const record of usage) {
        const hour = new Date(record.timestamp * 1000).getHours();
        usageByHour.set(hour, (usageByHour.get(hour) || 0) + record.kwh);
    }

    // Find peak price hours
    const priceByHour = new Map<number, number>();
    for (const record of prices) {
        const hour = new Date(record.timestamp * 1000).getHours();
        priceByHour.set(hour, record.price);
    }

    // Check for high usage during high price periods
    const highPriceThreshold = averagePrice * 1.2;
    let highCostHours: number[] = [];

    for (const [hour, usage] of usageByHour) {
        const price = priceByHour.get(hour) || 0;
        if (price > highPriceThreshold && usage > 0) {
            highCostHours.push(hour);
        }
    }

    if (highCostHours.length > 0) {
        suggestions.push(`Consider reducing usage during high-price hours: ${highCostHours.join(', ')}:00`);
    }

    // Find low price periods
    const lowPriceThreshold = averagePrice * 0.8;
    let lowPriceHours: number[] = [];

    for (const [hour, price] of priceByHour) {
        if (price < lowPriceThreshold) {
            lowPriceHours.push(hour);
        }
    }

    if (lowPriceHours.length > 0) {
        suggestions.push(`Best times for energy-intensive tasks: ${lowPriceHours.join(', ')}:00 (low prices)`);
    }

    // Peak usage analysis
    const maxUsage = Math.max(...Array.from(usageByHour.values()));
    const peakHours = Array.from(usageByHour.entries())
        .filter(([_, usage]) => usage === maxUsage)
        .map(([hour, _]) => hour);

    if (peakHours.length > 0) {
        suggestions.push(`Peak usage at ${peakHours.join(', ')}:00 - monitor equipment efficiency during these hours`);
    }

    // Early morning optimization
    const earlyMorningUsage = Array.from(usageByHour.entries())
        .filter(([hour, _]) => hour >= 5 && hour <= 8)
        .reduce((sum, [_, usage]) => sum + usage, 0);

    const earlyMorningPrice = Array.from(priceByHour.entries())
        .filter(([hour, _]) => hour >= 5 && hour <= 8)
        .reduce((sum, [_, price]) => sum + price, 0) / 4;

    if (earlyMorningUsage > 0 && earlyMorningPrice < averagePrice) {
        suggestions.push('Early morning (5-8am) offers good price opportunities for preparation work');
    }

    // Default suggestion if no specific patterns found
    if (suggestions.length === 0) {
        suggestions.push('Monitor usage patterns to identify optimization opportunities');
    }

    return suggestions;
} 