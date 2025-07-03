import { CostAnalysis, ElectricityData } from '../src/types';
import {
    performCompleteElectricityAnalysis,
    roundCurrency,
    roundPrice,
    roundUsage
} from '../src/utils/electricity-calculations';
import { generateCostSuggestions } from '../src/utils/electricity-suggestions';
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

        // Use new calculation utilities
        const analysis = performCompleteElectricityAnalysis(usage, prices);
        const suggestions = generateCostSuggestions(usage, prices, analysis.averagePrice);

        return {
            meteringPointId,
            date: date.toISOString().split('T')[0],
            totalKwh: roundUsage(analysis.totalKwh),
            totalCost: roundCurrency(analysis.totalCost),
            averagePrice: roundPrice(analysis.averagePrice),
            peakUsageHour: analysis.peakAnalysis.peakUsageHour,
            peakCostHour: analysis.peakAnalysis.peakCostHour,
            suggestions
        };
    } catch (error) {
        console.error('Error in calculateCostAnalysis:', error);
        return null;
    }
}

