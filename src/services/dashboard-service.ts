"use server";

import {
    calculateCostAnalysis,
    getMeteringPoints,
    getPricesForDate,
    getUsageForMeteringPointAndDate
} from '../../data';
import { MeteringPoint } from '../types';
import {
    calculateEfficiencyScore,
    calculateTotalCost,
    calculateTotalUsage,
    createHourlyDataPoints,
    createPriceByHourMap,
    getHourFromTimestamp,
    roundToDecimals
} from '../utils/electricity-calculations';
import { generateRealTimeRecommendation } from '../utils/electricity-suggestions';

interface DashboardOverview {
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

interface HourlyData {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

interface RealTimeInsights {
    meteringPointId: string;
    currentUsage: number;
    currentCost: number;
    currentPrice: number;
    hourProgress: number;
    todayTotal: {
        usage: number;
        cost: number;
    };
    recommendations: Array<{
        type: 'cost_optimization' | 'usage_reduction' | 'timing_adjustment';
        urgencyLevel: 'low' | 'medium' | 'high';
        message: string;
        potentialSavings?: number;
    }>;
    trends: {
        usageChange: number;
        costChange: number;
        efficiencyScore: number;
    };
    urgencyLevel?: 'low' | 'medium' | 'high';
    potentialSavings?: number;
    lastUpdated: string;
}

export async function getDashboardOverviewAction(
    dateString?: string
): Promise<{ success: boolean; data?: DashboardOverview; error?: string }> {
    try {
        const targetDate = dateString ? new Date(dateString) : new Date('2022-04-15');
        if (isNaN(targetDate.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const meteringPoints = await getMeteringPoints();

        let totalKwh = 0;
        let totalCost = 0;
        let totalPriceSum = 0;
        let activeMeters = 0;
        let highestCostMeter = '';
        let highestCost = 0;
        let overallPeakHour = 0;
        let maxPeakUsage = 0;
        const insights: string[] = [];

        for (const meter of meteringPoints) {
            try {
                const analysis = await calculateCostAnalysis(meter.id, targetDate);

                if (analysis && analysis.totalKwh > 0) {
                    totalKwh += analysis.totalKwh;
                    totalCost += analysis.totalCost;
                    totalPriceSum += analysis.averagePrice;
                    activeMeters++;

                    if (analysis.totalCost > highestCost) {
                        highestCost = analysis.totalCost;
                        highestCostMeter = meter.name || meter.id;
                    }

                    // Find the true overall peak hour by comparing peak usage values
                    // Note: This is a simplified approach - in reality we'd need to aggregate hourly data across all meters
                    if (analysis.totalKwh > maxPeakUsage) {
                        maxPeakUsage = analysis.totalKwh;
                        overallPeakHour = analysis.peakUsageHour;
                    }

                    if (analysis.suggestions.length > 0) {
                        insights.push(`${meter.name}: ${analysis.suggestions[0]}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to get GCS data for meter ${meter.id}:`, error);
            }
        }

        const averagePrice = activeMeters > 0 ? totalPriceSum / activeMeters : 0;
        const potentialSavingsToday = totalKwh * averagePrice * 0.1;

        const overview: DashboardOverview = {
            customer: {
                name: "My Amazing Bakery EOOD",
                owner: "Strahil"
            },
            meteringPoints,
            todayData: {
                totalKwh,
                totalCost,
                averagePrice,
                activeMeters
            },
            recentInsights: insights.slice(0, 5),
            quickStats: {
                highestCostMeter,
                peakUsageHour: overallPeakHour,
                potentialSavingsToday
            }
        };

        return { success: true, data: overview };
    } catch (error) {
        console.error('Error in getDashboardOverviewAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate dashboard overview'
        };
    }
}

export async function getHourlyDataAction(
    meteringPointId: string,
    dateString: string
): Promise<{ success: boolean; data?: HourlyData[]; error?: string }> {
    try {
        if (!meteringPointId || !dateString) {
            return { success: false, error: 'Metering point ID and date are required' };
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const [usage, prices] = await Promise.all([
            getUsageForMeteringPointAndDate(meteringPointId, date),
            getPricesForDate(date)
        ]);

        if (usage.length === 0 || prices.length === 0) {
            console.log(`❌ No GCS data available for ${meteringPointId} on ${dateString}`);
            return { success: false, error: 'No data available for the specified date and metering point' };
        }

        // Use new calculation utilities
        const hourlyData = createHourlyDataPoints(usage, prices);

        console.log(`✅ Generated hourly data for ${meteringPointId} on ${dateString} from GCS`);

        return { success: true, data: hourlyData };
    } catch (error) {
        console.error('Error in getHourlyDataAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get hourly data'
        };
    }
}

export async function getRealTimeInsightsAction(
    meteringPointId: string,
    dateString?: string
): Promise<{ success: boolean; data?: RealTimeInsights; error?: string }> {
    try {
        if (!meteringPointId) {
            return { success: false, error: 'Metering point ID is required' };
        }

        const targetDate = dateString ? new Date(dateString) : new Date('2022-04-15');
        if (isNaN(targetDate.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const currentHour = targetDate.getHours();

        const [usage, prices] = await Promise.all([
            getUsageForMeteringPointAndDate(meteringPointId, targetDate),
            getPricesForDate(targetDate)
        ]);

        if (usage.length === 0 || prices.length === 0) {
            console.log(`❌ No GCS data available for real-time insights for ${meteringPointId}`);
            return { success: false, error: 'No data available for real-time insights' };
        }

        const currentUsageRecords = usage.filter(u =>
            getHourFromTimestamp(u.timestamp) === currentHour
        );

        const currentPriceRecord = prices.find(p =>
            getHourFromTimestamp(p.timestamp) === currentHour
        );

        const currentUsage = calculateTotalUsage(currentUsageRecords);
        const currentPrice = currentPriceRecord?.price || 0;
        const currentCost = currentUsage * currentPrice;

        const result = generateRealTimeRecommendation(
            currentUsage,
            currentPrice,
            usage,
            prices,
            currentHour
        );
        const { recommendation, urgencyLevel } = {
            recommendation: result.recommendation,
            urgencyLevel: result.urgencyLevel
        };

        // Use new calculation utilities
        const todayUsage = calculateTotalUsage(usage);
        const priceMap = createPriceByHourMap(prices);
        const todayCost = calculateTotalCost(usage, priceMap);

        // Calculate hour progress (0-100%) - use fixed value for historical data
        const hourProgress = dateString ? 50 : ((new Date().getMinutes() / 60) * 100);

        // Calculate deterministic trends based on actual data
        const avgUsagePerHour = todayUsage / 24;
        const avgCostPerHour = todayCost / 24;
        const efficiencyScore = calculateEfficiencyScore(usage);

        const deterministicTrends = {
            usageChange: currentUsage - avgUsagePerHour, // Actual vs average
            costChange: currentCost - avgCostPerHour,   // Actual vs average  
            efficiencyScore: roundToDecimals(efficiencyScore, 2), // Based on peak vs off-peak usage
        };

        const insights: RealTimeInsights = {
            meteringPointId,
            currentUsage,
            currentCost,
            currentPrice,
            hourProgress,
            todayTotal: {
                usage: todayUsage,
                cost: todayCost,
            },
            recommendations: [{
                type: 'cost_optimization',
                urgencyLevel,
                message: recommendation,
                potentialSavings: currentCost * 0.15, // 15% potential savings
            }],
            trends: deterministicTrends,
            urgencyLevel,
            potentialSavings: currentCost * 0.15,
            lastUpdated: dateString ? targetDate.toISOString() : new Date().toISOString(),
        };

        return { success: true, data: insights };
    } catch (error) {
        console.error('Error in getRealTimeInsightsAction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get real-time insights'
        };
    }
}

