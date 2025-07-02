"use server";

import {
    calculateCostAnalysis,
    generateMockPriceData,
    generateMockUsageData,
    getMeteringPoints,
    getPricesForDate,
    getUsageForMeteringPointAndDate
} from '../../data';
import { MeteringPoint } from '../types';

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
        const targetDate = dateString ? new Date(dateString) : new Date();
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

                    overallPeakHour = analysis.peakUsageHour;

                    if (analysis.suggestions.length > 0) {
                        insights.push(`${meter.name}: ${analysis.suggestions[0]}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to get data for meter ${meter.id}:`, error);
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

        let usage, prices;

        try {
            // Try to get real data first
            [usage, prices] = await Promise.all([
                getUsageForMeteringPointAndDate(meteringPointId, date),
                getPricesForDate(date)
            ]);

            // If no real data available, use mock data
            if (usage.length === 0) {
                console.log(`No usage data found for ${meteringPointId}, using mock data`);
                usage = generateMockUsageData(meteringPointId, date);
            }

            if (prices.length === 0) {
                console.log(`No price data found for ${date.toISOString().split('T')[0]}, using mock data`);
                prices = generateMockPriceData(date);
            }
        } catch (error) {
            console.log(`Error fetching real data, using mock data:`, error);
            // Fall back to mock data if there are any errors
            usage = generateMockUsageData(meteringPointId, date);
            prices = generateMockPriceData(date);
        }

        const hourlyMap = new Map<number, HourlyData>();

        // Initialize all 24 hours with zero values
        for (let hour = 0; hour < 24; hour++) {
            hourlyMap.set(hour, {
                hour,
                usage: 0,
                price: 0,
                cost: 0
            });
        }

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

        const hourlyData = Array.from(hourlyMap.values()).sort((a, b) => a.hour - b.hour);

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

        const targetDate = dateString ? new Date(dateString) : new Date();
        if (isNaN(targetDate.getTime())) {
            return { success: false, error: 'Invalid date format' };
        }

        const currentHour = targetDate.getHours();

        const [usage, prices] = await Promise.all([
            getUsageForMeteringPointAndDate(meteringPointId, targetDate),
            getPricesForDate(targetDate)
        ]);

        const currentUsageRecords = usage.filter(u =>
            new Date(u.timestamp * 1000).getHours() === currentHour
        );

        const currentPriceRecord = prices.find(p =>
            new Date(p.timestamp * 1000).getHours() === currentHour
        );

        const currentUsage = currentUsageRecords.reduce((sum, u) => sum + u.kwh, 0);
        const currentPrice = currentPriceRecord?.price || 0;
        const currentCost = currentUsage * currentPrice;

        const { recommendation, urgencyLevel } = generateRealTimeRecommendation(
            currentHour,
            currentUsage,
            currentPrice,
            prices,
            usage
        );

        // Calculate today's totals
        const todayUsage = usage.reduce((sum, u) => sum + u.kwh, 0);
        const todayCost = usage.reduce((sum, u, index) => {
            const price = prices[index]?.price || 0;
            return sum + (u.kwh * price);
        }, 0);

        // Calculate hour progress (0-100%)
        const now = new Date();
        const hourProgress = (now.getMinutes() / 60) * 100;

        // Generate mock trends (in a real app, these would come from historical data)
        const mockTrends = {
            usageChange: Math.random() * 20 - 10, // -10% to +10%
            costChange: Math.random() * 20 - 10,  // -10% to +10%
            efficiencyScore: Math.random() * 40 + 60, // 60-100%
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
            trends: mockTrends,
            urgencyLevel,
            potentialSavings: currentCost * 0.15,
            lastUpdated: new Date().toISOString(),
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

function generateRealTimeRecommendation(
    currentHour: number,
    currentUsage: number,
    currentPrice: number,
    prices: any[],
    usage: any[]
): { recommendation: string; urgencyLevel: 'low' | 'medium' | 'high' } {
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const avgUsage = usage.reduce((sum, u) => sum + u.kwh, 0) / usage.length;

    const priceThresholdHigh = avgPrice * 1.2;
    const priceThresholdLow = avgPrice * 0.8;
    const usageThresholdHigh = avgUsage * 1.5;

    if (currentPrice > priceThresholdHigh && currentUsage > usageThresholdHigh) {
        return {
            recommendation: `HIGH ALERT: Both price (${currentPrice.toFixed(4)} BGN/kWh) and usage (${currentUsage.toFixed(1)} kWh) are very high right now. Consider postponing non-essential baking activities.`,
            urgencyLevel: 'high'
        };
    }

    if (currentPrice > priceThresholdHigh) {
        return {
            recommendation: `Price is high right now (${currentPrice.toFixed(4)} BGN/kWh). Consider reducing usage or postponing energy-intensive activities to the next hour.`,
            urgencyLevel: 'medium'
        };
    }

    if (currentUsage > usageThresholdHigh) {
        return {
            recommendation: `Usage is high this hour (${currentUsage.toFixed(1)} kWh). Monitor equipment to ensure efficient operation.`,
            urgencyLevel: 'medium'
        };
    }

    if (currentPrice < priceThresholdLow) {
        return {
            recommendation: `Great time to operate! Price is low (${currentPrice.toFixed(4)} BGN/kWh). Consider running energy-intensive equipment now.`,
            urgencyLevel: 'low'
        };
    }

    const nextHourPrice = prices.find(p =>
        new Date(p.timestamp * 1000).getHours() === (currentHour + 1) % 24
    );

    if (nextHourPrice && nextHourPrice.price < currentPrice * 0.9) {
        return {
            recommendation: `Price will drop significantly next hour (${nextHourPrice.price.toFixed(4)} BGN/kWh). Consider waiting for non-urgent activities.`,
            urgencyLevel: 'low'
        };
    }

    return {
        recommendation: `Normal operations. Current price: ${currentPrice.toFixed(4)} BGN/kWh, usage: ${currentUsage.toFixed(1)} kWh.`,
        urgencyLevel: 'low'
    };
} 