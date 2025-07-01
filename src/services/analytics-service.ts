"use server";

import {
    calculateCostAnalysis,
    getElectricityDataForDateRange,
    validateMeteringPointAccess
} from '../../data';

interface DailySummary {
    date: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakUsageHour: number;
    suggestions: string[];
}

interface WeeklySummary {
    weekStartDate: string;
    weekEndDate: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    dailySummaries: DailySummary[];
    weeklyInsights: string[];
}

interface MonthlySummary {
    month: string;
    year: number;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    costSavingsOpportunity: number;
    monthlySuggestions: string[];
}

export async function getDailySummaryAction(
    meteringPointId: string,
    dateString: string
): Promise<{ success: boolean; data?: DailySummary; error?: string }> {
    try {
        if (!meteringPointId || !dateString) {
            return { success: false, error: 'Metering point ID and date are required' };
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const analysis = await calculateCostAnalysis(meteringPointId, date);

        if (!analysis) {
            return { success: false, error: 'Unable to generate daily summary - insufficient data' };
        }

        const summary: DailySummary = {
            date: analysis.date,
            totalKwh: analysis.totalKwh,
            totalCost: analysis.totalCost,
            averagePrice: analysis.averagePrice,
            peakUsageHour: analysis.peakUsageHour,
            suggestions: analysis.suggestions
        };

        return { success: true, data: summary };
    } catch (error) {
        console.error('Error in getDailySummaryAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate daily summary'
        };
    }
}

export async function getWeeklySummaryAction(
    meteringPointId: string,
    startDateString: string
): Promise<{ success: boolean; data?: WeeklySummary; error?: string }> {
    try {
        if (!meteringPointId || !startDateString) {
            return { success: false, error: 'Metering point ID and start date are required' };
        }

        const startDate = new Date(startDateString);
        if (isNaN(startDate.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const dailySummaries: DailySummary[] = [];
        let totalWeeklyKwh = 0;
        let totalWeeklyCost = 0;
        let totalPriceSum = 0;
        let validDays = 0;

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const analysis = await calculateCostAnalysis(meteringPointId, new Date(currentDate));

            if (analysis) {
                const dailySummary: DailySummary = {
                    date: analysis.date,
                    totalKwh: analysis.totalKwh,
                    totalCost: analysis.totalCost,
                    averagePrice: analysis.averagePrice,
                    peakUsageHour: analysis.peakUsageHour,
                    suggestions: analysis.suggestions.slice(0, 2)
                };

                dailySummaries.push(dailySummary);
                totalWeeklyKwh += analysis.totalKwh;
                totalWeeklyCost += analysis.totalCost;
                totalPriceSum += analysis.averagePrice;
                validDays++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (validDays === 0) {
            return { success: false, error: 'No data available for the specified week' };
        }

        const averageWeeklyPrice = totalPriceSum / validDays;
        const weeklyInsights = generateWeeklyInsights(dailySummaries, totalWeeklyKwh, totalWeeklyCost);

        const summary: WeeklySummary = {
            weekStartDate: startDate.toISOString().split('T')[0],
            weekEndDate: endDate.toISOString().split('T')[0],
            totalKwh: totalWeeklyKwh,
            totalCost: totalWeeklyCost,
            averagePrice: averageWeeklyPrice,
            dailySummaries,
            weeklyInsights
        };

        return { success: true, data: summary };
    } catch (error) {
        console.error('Error in getWeeklySummaryAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate weekly summary'
        };
    }
}

export async function getMonthlySummaryAction(
    meteringPointId: string,
    month: number,
    year: number
): Promise<{ success: boolean; data?: MonthlySummary; error?: string }> {
    try {
        if (!meteringPointId || !month || !year) {
            return { success: false, error: 'Metering point ID, month, and year are required' };
        }

        if (month < 1 || month > 12) {
            return { success: false, error: 'Month must be between 1 and 12' };
        }

        if (year < 2020 || year > new Date().getFullYear()) {
            return { success: false, error: 'Invalid year' };
        }

        const hasAccess = await validateMeteringPointAccess(meteringPointId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied for this metering point' };
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const data = await getElectricityDataForDateRange(meteringPointId, startDate, endDate);

        if (!data || data.length === 0) {
            return { success: false, error: 'No data available for the specified month' };
        }

        let totalKwh = 0;
        let totalCost = 0;
        let totalPriceSum = 0;
        let validDays = 0;

        for (const dayData of data) {
            const analysis = await calculateCostAnalysis(meteringPointId, new Date(dayData.date));
            if (analysis) {
                totalKwh += analysis.totalKwh;
                totalCost += analysis.totalCost;
                totalPriceSum += analysis.averagePrice;
                validDays++;
            }
        }

        if (validDays === 0) {
            return { success: false, error: 'Unable to calculate monthly summary - insufficient data' };
        }

        const averagePrice = totalPriceSum / validDays;
        const costSavingsOpportunity = calculateCostSavingsOpportunity(totalKwh, averagePrice);
        const monthlySuggestions = generateMonthlySuggestions(totalKwh, totalCost, averagePrice, validDays);

        const summary: MonthlySummary = {
            month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
            year,
            totalKwh,
            totalCost,
            averagePrice,
            costSavingsOpportunity,
            monthlySuggestions
        };

        return { success: true, data: summary };
    } catch (error) {
        console.error('Error in getMonthlySummaryAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate monthly summary'
        };
    }
}

function generateWeeklyInsights(dailySummaries: DailySummary[], totalKwh: number, totalCost: number): string[] {
    const insights: string[] = [];

    if (dailySummaries.length === 0) return insights;

    const avgDailyKwh = totalKwh / dailySummaries.length;
    const avgDailyCost = totalCost / dailySummaries.length;

    const highestUsageDay = dailySummaries.reduce((max, day) =>
        day.totalKwh > max.totalKwh ? day : max
    );

    const lowestUsageDay = dailySummaries.reduce((min, day) =>
        day.totalKwh < min.totalKwh ? day : min
    );

    insights.push(`Average daily consumption: ${avgDailyKwh.toFixed(1)} kWh (${avgDailyCost.toFixed(2)} BGN)`);
    insights.push(`Highest usage: ${highestUsageDay.totalKwh.toFixed(1)} kWh on ${new Date(highestUsageDay.date).toLocaleDateString()}`);
    insights.push(`Lowest usage: ${lowestUsageDay.totalKwh.toFixed(1)} kWh on ${new Date(lowestUsageDay.date).toLocaleDateString()}`);

    const usageVariation = ((highestUsageDay.totalKwh - lowestUsageDay.totalKwh) / avgDailyKwh) * 100;
    if (usageVariation > 50) {
        insights.push(`High usage variation detected (${usageVariation.toFixed(0)}%). Consider stabilizing your baking schedule.`);
    }

    return insights;
}

function calculateCostSavingsOpportunity(totalKwh: number, averagePrice: number): number {
    const potentialSavingsPercentage = 0.15;
    return totalKwh * averagePrice * potentialSavingsPercentage;
}

function generateMonthlySuggestions(totalKwh: number, totalCost: number, averagePrice: number, validDays: number): string[] {
    const suggestions: string[] = [];

    const dailyAvgKwh = totalKwh / validDays;
    const dailyAvgCost = totalCost / validDays;

    if (dailyAvgKwh > 60) {
        suggestions.push(`High monthly consumption detected (${totalKwh.toFixed(0)} kWh). Consider energy-efficient ovens and equipment.`);
    }

    if (averagePrice > 0.25) {
        suggestions.push(`Electricity prices are high this month (avg. ${averagePrice.toFixed(4)} BGN/kWh). Focus on off-peak baking hours.`);
    }

    const potentialMonthlySavings = calculateCostSavingsOpportunity(totalKwh, averagePrice);
    suggestions.push(`Potential monthly savings: ${potentialMonthlySavings.toFixed(2)} BGN through optimized scheduling and equipment upgrades.`);

    suggestions.push(`Consider installing smart meters and timers to automate equipment during low-price periods.`);

    return suggestions;
} 