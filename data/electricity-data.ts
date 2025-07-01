import { CostAnalysis, ElectricityData } from '../src/types';
import { validateMeteringPointAccess } from './customers';
import { getPricesForDate } from './prices';
import {
    getPeakUsageHourForMeteringPointAndDate,
    getUsageForMeteringPointAndDate
} from './usage';

export async function getElectricityDataForDate(meteringPointId: string, date: Date): Promise<ElectricityData | null> {
    const hasAccess = await validateMeteringPointAccess(meteringPointId);
    if (!hasAccess) {
        throw new Error(`Access denied for metering point: ${meteringPointId}`);
    }

    const [usage, prices] = await Promise.all([
        getUsageForMeteringPointAndDate(meteringPointId, date),
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

export async function calculateCostAnalysis(meteringPointId: string, date: Date): Promise<CostAnalysis | null> {
    const hasAccess = await validateMeteringPointAccess(meteringPointId);
    if (!hasAccess) {
        throw new Error(`Access denied for metering point: ${meteringPointId}`);
    }

    const [usage, prices] = await Promise.all([
        getUsageForMeteringPointAndDate(meteringPointId, date),
        getPricesForDate(date)
    ]);

    if (usage.length === 0 || prices.length === 0) {
        return null;
    }

    let totalCost = 0;
    let totalKwh = 0;
    const hourlyCosts: Record<number, number> = {};

    for (const usageRecord of usage) {
        const usageHour = new Date(usageRecord.timestamp * 1000).getHours();
        const correspondingPrice = prices.find(p => {
            const priceHour = new Date(p.timestamp * 1000).getHours();
            return priceHour === usageHour;
        });

        if (correspondingPrice) {
            const cost = usageRecord.kwh * correspondingPrice.price;
            totalCost += cost;
            totalKwh += usageRecord.kwh;
            hourlyCosts[usageHour] = (hourlyCosts[usageHour] || 0) + cost;
        }
    }

    if (totalKwh === 0) {
        return null;
    }

    const averagePrice = totalCost / totalKwh;

    const peakUsage = await getPeakUsageHourForMeteringPointAndDate(meteringPointId, date);
    const peakUsageHour = peakUsage?.hour || 0;

    const peakCostHour = Object.entries(hourlyCosts).reduce((max, [hour, cost]) =>
        cost > (hourlyCosts[max] || 0) ? parseInt(hour) : max, 0
    );

    const suggestions = generateCostSuggestions(hourlyCosts, prices, totalKwh, averagePrice);

    return {
        meteringPointId,
        date: date.toISOString().split('T')[0],
        totalKwh,
        totalCost,
        averagePrice,
        peakUsageHour,
        peakCostHour,
        suggestions
    };
}

function generateCostSuggestions(
    hourlyCosts: Record<number, number>,
    prices: any[],
    totalKwh: number,
    averagePrice: number
): string[] {
    const suggestions: string[] = [];

    const sortedHours = Object.entries(hourlyCosts).sort(([, a], [, b]) => b - a);
    const highestCostHour = sortedHours[0];

    if (highestCostHour) {
        suggestions.push(`Your highest cost hour is ${highestCostHour[0]}:00. Consider reducing usage during this time.`);
    }

    const lowestPricePeriods = prices
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map(p => new Date(p.timestamp * 1000).getHours());

    suggestions.push(`Consider shifting high-energy activities to hours: ${lowestPricePeriods.join(', ')} when prices are lowest.`);

    if (totalKwh > 50) {
        suggestions.push(`Daily consumption of ${totalKwh.toFixed(1)} kWh is high. Consider energy-efficient equipment for your bakery.`);
    }

    const priceVariation = Math.max(...prices.map(p => p.price)) - Math.min(...prices.map(p => p.price));
    if (priceVariation > 0.05) {
        suggestions.push(`Electricity prices vary significantly throughout the day. Timing your baking activities can save up to ${(priceVariation * totalKwh).toFixed(2)} BGN per day.`);
    }

    return suggestions;
} 